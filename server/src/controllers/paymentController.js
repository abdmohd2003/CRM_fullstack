// controllers/paymentController.js
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const Invoice = require("../models/Invoice");

const { 
  generateReceiptNumber, 
  updateOrderPaymentStatus,
  sendPaymentReceipt,
  triggerERPWebhook 
} = require("../utils/orderHelpers");

// ⭐ Get all payments with optional filters
const getAllPayments = async (req, res) => {
  try {
    const { status, method, orderId, limit = 100, page = 1 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (method) query.method = method;
    if (orderId) query.orderId = orderId;
    
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'firstName lastName email')
        .populate({
          path: 'orderId',
          select: 'orderNumber contactName companyName totalAmount status'
        })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);
    
    res.status(200).json({ 
      success: true, 
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Record payment manually (Step 7)
const recordPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      paymentDate,
      method,
      reference,
      transactionId,
      notes,
      invoiceId
    } = req.body;

    const userId = req.user?._id || req.user?.id || 'system';

    // Validate order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for cancelled order' });
    }

    // Check if payment exceeds balance
    // NOTE: order.balanceDue and amount are floats, so direct subtraction/
    // comparison can be off by fractions of a cent (e.g. 8280.00 - 8279.97
    // = 0.029999999999745 instead of 0.03) due to IEEE-754 floating point
    // representation. Round both to 2 decimal places before comparing,
    // with a small tolerance, so a "full" payment isn't wrongly flagged
    // as exceeding balance and doesn't leave a phantom remainder.
    const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    const roundedAmount = round2(amount);
    const roundedBalance = round2(order.balanceDue);

    if (roundedAmount - roundedBalance > 0.01) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (${roundedAmount}) exceeds balance due (${roundedBalance})` 
      });
    }


const invoice = await Invoice.findOne({ orderId });

const payment = new Payment({
    orderId,
    userId,
    amount: roundedAmount,
    paymentDate: new Date(paymentDate || Date.now()),
    method,
    status: "COMPLETED",
    reference,
    transactionId,
    notes,
    receiptNumber: generateReceiptNumber(),
    invoiceId: invoice ? invoice._id : null,
});

    await payment.save();

    // Log activity - using your schema
    await Activity.create({
      order: order._id,
      payment: payment._id,
      type: 'Payment',
      itemRef: payment._id,
      description: `Payment of ${amount} recorded via ${method}${reference ? ' (Ref: ' + reference + ')' : ''}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'PAYMENT_RECORDED',
      metadata: { amount, method, reference }
    });

    // Step 8: Update order payment status
    const updatedOrder = await updateOrderPaymentStatus(orderId);

    // Send payment receipt
    try {
      if (order.contactEmail) {
        await sendPaymentReceipt(order.contactEmail, payment, order);
        console.log('✅ Payment receipt sent to:', order.contactEmail);
      } else {
        console.log('⚠️ No email address for receipt, skipping');
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send payment receipt:', emailError.message);
      // Don't fail the payment recording
    }

    // Step 9: Check if order is now fully paid
    if (updatedOrder.status === 'PAID') {
      // Update deal revenue
      await Deal.findByIdAndUpdate(order.dealId, {
        revenueCollected: order.totalAmount
      });

      // Log paid activity - using your schema
      await Activity.create({
        order: order._id,
        type: 'Order',
        itemRef: order._id,
        description: `Order ${order.orderNumber} fully paid. Total: ${order.totalAmount}`,
        activityDate: new Date(),
        createdBy: userId,
        action: 'ORDER_PAID',
        metadata: { totalAmount: order.totalAmount }
      });

      // Create notification
      await Notification.create({
        userId: order.userId,
        title: '💰 Order Paid',
        message: `Order ${order.orderNumber} has been fully paid. Amount: $${order.totalAmount}`,
        type: 'ORDER_PAID',
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
        read: false,
      });

      // Trigger ERP webhook if configured
      await triggerERPWebhook(orderId, 'order_paid');
    } else if (updatedOrder.status === 'PARTIAL') {
      // Create notification for partial payment
      await Notification.create({
        userId: order.userId,
        title: '💳 Partial Payment',
        message: `Partial payment of ${amount} received for order ${order.orderNumber}. Balance due: $${updatedOrder.balanceDue}`,
        type: 'PAYMENT_RECEIVED',
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
        read: false,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        payment,
        order: updatedOrder,
        progress: updatedOrder.progress
      },
      message: `Payment of ${amount} recorded successfully. ${updatedOrder.status === 'PAID' ? 'Order is now fully paid!' : 'Balance due: $' + updatedOrder.balanceDue}`
    });
  } catch (error) {
    console.error('❌ Record payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?._id || req.user?.id || 'system';

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only completed payments can be refunded' 
      });
    }

    // Update payment status
    payment.status = 'REFUNDED';
    await payment.save();

    // Log activity - using your schema
    await Activity.create({
      order: payment.orderId,
      payment: payment._id,
      type: 'Payment',
      itemRef: payment._id,
      description: `Payment of ${payment.amount} refunded${payment.reference ? ' (Ref: ' + payment.reference + ')' : ''}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'PAYMENT_REFUNDED',
      metadata: { amount: payment.amount, reference: payment.reference }
    });

    // Update order status
    const updatedOrder = await updateOrderPaymentStatus(payment.orderId);

    // Create notification for refund
    await Notification.create({
      userId: payment.userId,
      title: '🔄 Payment Refunded',
      message: `Payment of $${payment.amount.toFixed(2)} has been refunded for order ${payment.orderId}`,
      type: 'PAYMENT_REFUNDED',
      link: `/orders/${payment.orderId}`,
      metadata: { orderId: payment.orderId },
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        payment,
        order: updatedOrder
      },
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'orderId',
        populate: [
          { path: 'dealId' },
          { path: 'invoice', model: 'Invoice' }
        ]
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Get activities - using your schema
    const activities = await Activity.find({ payment: payment._id })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: {
        ...payment.toObject(),
        activities
      } 
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments for an order
const getOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payments = await Payment.find({ orderId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate payment link (Stripe)
const generatePaymentLink = async (req, res) => {
  try {
    const { orderId } = req.params;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const userId = req.user?._id || req.user?.id || 'system';

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.balanceDue <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is already fully paid' 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.balanceDue * 100),
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId.toString(),
      },
      receipt_email: order.contactEmail,
    });

    // Store the payment intent
    const payment = new Payment({
      orderId: order._id,
      userId: userId,
      amount: order.balanceDue,
      paymentDate: new Date(),
      method: 'ONLINE',
      status: 'PENDING',
      transactionId: paymentIntent.id,
      reference: paymentIntent.client_secret,
      gatewayResponse: { paymentIntentId: paymentIntent.id },
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentLink: paymentIntent.client_secret,
        paymentId: payment._id,
      },
      message: 'Payment link generated successfully'
    });
  } catch (error) {
    console.error('Generate payment link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getAllPayments, 
  processRefund,
  getPaymentById,
  getOrderPayments,
  generatePaymentLink,
};