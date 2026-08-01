// controllers/webhookController.js
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const { updateOrderPaymentStatus, triggerERPWebhook } = require("../utils/orderHelpers");

class WebhookController {
  // Stripe webhook handler
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      let isTestMode = req.headers['x-test-mode'] === 'true';

      // Parse req.body if it is a Buffer (since express.raw parses as raw Buffer)
      let parsedBody;
      if (Buffer.isBuffer(req.body)) {
        try {
          parsedBody = JSON.parse(req.body.toString());
          if (parsedBody && parsedBody._test === true) {
            isTestMode = true;
          }
        } catch (e) {
          // not JSON
        }
      } else if (req.body && req.body._test === true) {
        isTestMode = true;
        parsedBody = req.body;
      }

      if (isTestMode) {
        console.log('🧪 Test mode webhook detected - skipping signature verification');
        event = parsedBody || req.body;
      } else {
        if (!webhookSecret) {
          console.error('Stripe webhook secret not configured');
          return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
          console.error('Webhook signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      }

      console.log(`Received Stripe webhook: ${event.type}${isTestMode ? ' (TEST MODE)' : ''}`);

      let result;

      switch (event.type) {
        case 'payment_intent.succeeded':
          result = await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'charge.refunded':
          result = await this.handleRefund(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ 
        received: true, 
        processed: event.type,
        result: result || null
      });

    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Handle payment success
  async handlePaymentSuccess(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return { success: false, message: 'No orderId found' };
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return { success: false, message: 'Order not found' };
    }

    // Check if payment already recorded
    const existingPayment = await Payment.findOne({ 
      transactionId: paymentIntent.id,
      orderId: orderId 
    });

    if (existingPayment) {
      console.log(`Payment already recorded: ${paymentIntent.id}`);
      return { success: true, message: 'Payment already recorded' };
    }

    // Record payment
    const payment = new Payment({
      orderId,
      amount: paymentIntent.amount / 100,
      paymentDate: new Date(),
      method: 'ONLINE',
      status: 'COMPLETED',
      transactionId: paymentIntent.id,
      reference: paymentIntent.id,
      gatewayResponse: paymentIntent,
      receiptNumber: `RCPT-${Date.now().toString(36).toUpperCase()}`,
    });

    await payment.save();

    // Log activity - using your schema
    await Activity.create({
      order: orderId,
      payment: payment._id,
      type: 'Payment',
      itemRef: payment._id,
      description: `Payment of ${paymentIntent.amount / 100} auto-recorded via Stripe`,
      activityDate: new Date(),
      createdBy: 'system',
      action: 'PAYMENT_AUTO_RECORDED',
      metadata: { 
        transactionId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown'
      }
    });

    // Update order status
    const updatedOrder = await updateOrderPaymentStatus(orderId);

    // Create notification
    await Notification.create({
      userId: order.userId,
      title: '💳 Payment Received',
      message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received for order ${order.orderNumber}`,
      type: 'PAYMENT_RECEIVED',
      link: `/orders/${orderId}`,
      metadata: { 
        orderId: orderId,
        amount: paymentIntent.amount / 100,
        transactionId: paymentIntent.id
      },
      read: false,
    });

    // Check if fully paid
    if (updatedOrder.status === 'PAID') {
      // Update deal revenue
      await Deal.findByIdAndUpdate(order.dealId, {
        revenueCollected: order.totalAmount
      });

      // Log paid activity - using your schema
      await Activity.create({
        order: orderId,
        type: 'Order',
        itemRef: orderId,
        description: `Order ${order.orderNumber} fully paid via Stripe`,
        activityDate: new Date(),
        createdBy: 'system',
        action: 'ORDER_PAID',
        metadata: { totalAmount: order.totalAmount }
      });

      // Create notification for full payment
      await Notification.create({
        userId: order.userId,
        title: '💰 Order Paid',
        message: `Order ${order.orderNumber} is now fully paid`,
        type: 'ORDER_PAID',
        link: `/orders/${orderId}`,
        metadata: { orderId: orderId },
        read: false,
      });

      // Trigger ERP webhook
      await triggerERPWebhook(orderId, 'order_paid');
    }

    return { 
      success: true, 
      message: 'Payment processed successfully',
      orderStatus: updatedOrder.status
    };
  }

  // Handle payment failed
  async handlePaymentFailed(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return { success: false, message: 'No orderId found' };
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return { success: false, message: 'Order not found' };
    }

    // Record failed payment
    const payment = new Payment({
      orderId,
      amount: paymentIntent.amount / 100,
      paymentDate: new Date(),
      method: 'ONLINE',
      status: 'FAILED',
      transactionId: paymentIntent.id,
      reference: paymentIntent.id,
      gatewayResponse: paymentIntent,
      notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    });

    await payment.save();

    // Log activity - using your schema
    await Activity.create({
      order: orderId,
      payment: payment._id,
      type: 'Payment',
      itemRef: payment._id,
      description: `Payment of ${paymentIntent.amount / 100} failed via Stripe`,
      activityDate: new Date(),
      createdBy: 'system',
      action: 'PAYMENT_FAILED',
      metadata: { 
        transactionId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message || 'Unknown error'
      }
    });

    // Create notification for failure
    await Notification.create({
      userId: order.userId,
      title: '⚠️ Payment Failed',
      message: `Payment for order ${order.orderNumber} failed. Please try again.`,
      type: 'PAYMENT_FAILED',
      link: `/orders/${orderId}`,
      metadata: { 
        orderId: orderId,
        error: paymentIntent.last_payment_error?.message
      },
      read: false,
    });

    return { 
      success: true, 
      message: 'Payment failure recorded',
      error: paymentIntent.last_payment_error?.message
    };
  }

  // Handle refund webhook
  async handleRefund(charge) {
    const orderId = charge.metadata?.orderId;
    
    if (!orderId) {
      console.error('No orderId in charge metadata');
      return { success: false, message: 'No orderId found' };
    }

    // Find the original payment
    const originalPayment = await Payment.findOne({
      transactionId: charge.payment_intent,
      orderId: orderId
    });

    if (originalPayment && originalPayment.status !== 'REFUNDED') {
      originalPayment.status = 'REFUNDED';
      await originalPayment.save();

      // Update order status
      await updateOrderPaymentStatus(orderId);

      // Log activity - using your schema
      await Activity.create({
        order: orderId,
        payment: originalPayment._id,
        type: 'Payment',
        itemRef: originalPayment._id,
        description: `Payment of ${originalPayment.amount} refunded via Stripe`,
        activityDate: new Date(),
        createdBy: 'system',
        action: 'PAYMENT_REFUNDED',
        metadata: { 
          chargeId: charge.id,
          refundAmount: charge.amount_refunded / 100
        }
      });

      // Create notification
      await Notification.create({
        userId: originalPayment.userId,
        title: '🔄 Payment Refunded',
        message: `Payment of $${originalPayment.amount.toFixed(2)} has been refunded for order ${originalPayment.orderId}`,
        type: 'PAYMENT_REFUNDED',
        link: `/orders/${orderId}`,
        metadata: { orderId: orderId },
        read: false,
      });
    }

    return { success: true, message: 'Refund processed' };
  }

  // Generic webhook handler for other providers
  async handleGenericWebhook(req, res) {
    try {
      const { provider, event, data } = req.body;

      console.log(`Received webhook from ${provider}:`, event);

      res.status(200).json({
        success: true,
        message: `Webhook from ${provider} received`,
        processed: true
      });

    } catch (error) {
      console.error('Generic webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Test webhook endpoint
  async testWebhook(req, res) {
    try {
      const { event, data } = req.body;

      console.log('Test webhook received:', { event, data });

      res.status(200).json({
        success: true,
        message: 'Test webhook received successfully',
        received: { event, data }
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new WebhookController();