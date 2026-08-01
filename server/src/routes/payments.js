// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Deal = require('../models/Deal');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { 
  generateReceiptNumber, 
  updateOrderPaymentStatus,
  triggerERPWebhook 
} = require('../utils/orderHelpers');

// Import the entire email service
const emailService = require('../services/email.service');

const { protect } = require('../middleware/auth.middleware');

// ⭐ Helper function to validate email
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// GET all payments with optional filters
router.get('/', protect, async (req, res) => {
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
    
    res.json({ 
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
});

// Get payments for an order - MUST come before /:paymentId
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const payments = await Payment.find({ orderId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });

  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment summary for an order
router.get('/order/:orderId/summary', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payments = await Payment.find({ 
      orderId, 
      status: 'COMPLETED' 
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = order.totalAmount - totalPaid;
    const progress = order.totalAmount > 0 ? Math.round((totalPaid / order.totalAmount) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalAmount: order.totalAmount,
        totalPaid,
        balanceDue,
        progress,
        paymentCount: payments.length,
        payments
      }
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// STEP 7: Record Payment (Manual)
router.post('/record', protect, async (req, res) => {
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

    const userId = req.user._id || req.user.id;

    // Validate order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for cancelled order' });
    }

    // Check if payment exceeds balance
    if (amount > order.balanceDue) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (${amount}) exceeds balance due (${order.balanceDue})` 
      });
    }

    // Create payment record
    const payment = new Payment({
      orderId,
      userId,
      amount,
      paymentDate: new Date(paymentDate || Date.now()),
      method,
      status: 'COMPLETED',
      reference,
      transactionId,
      notes,
      receiptNumber: generateReceiptNumber(),
      invoiceId: invoiceId || null,
    });

    await payment.save();

    // Log activity - using your Activity schema
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

    // STEP 8: Update order payment status (recalculates balance)
    const updatedOrder = await updateOrderPaymentStatus(orderId);

    // ⭐ Send payment receipt with validation
    let emailSent = false;
    let emailMessage = '';

    try {
      const emailTo = order.contactEmail;
      if (emailTo && isValidEmail(emailTo)) {
        await emailService.sendPaymentReceipt(emailTo, payment, order);
        emailSent = true;
        emailMessage = `Receipt sent to ${emailTo}`;
        console.log('✅ Payment receipt sent to:', emailTo);
      } else {
        const reason = !emailTo ? 'No email address' : 'Invalid email format';
        emailMessage = `${reason}, skipping receipt`;
        console.log(`⚠️ ${emailMessage}`);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send payment receipt:', emailError.message);
      emailMessage = 'Failed to send receipt';
      // Don't fail the payment recording
    }

    // STEP 9: Check if order is now fully paid
    if (updatedOrder.status === 'PAID') {
      // Update deal revenue
      await Deal.findByIdAndUpdate(order.dealId, {
        revenueCollected: order.totalAmount
      });

      // Log paid activity - using your Activity schema
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
        progress: updatedOrder.progress,
        emailSent,
        emailMessage
      },
      message: `Payment of ${amount} recorded successfully. ${updatedOrder.status === 'PAID' ? 'Order is now fully paid!' : 'Balance due: $' + updatedOrder.balanceDue} ${emailMessage ? '• ' + emailMessage : ''}`
    });

  } catch (error) {
    console.error('❌ Record payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process refund
router.post('/:paymentId/refund', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id || req.user.id;

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

    // Log activity - using your Activity schema
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

    res.json({
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
});

// Generate payment link (Stripe)
router.post('/:orderId/payment-link', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const userId = req.user._id || req.user.id;

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

    // ⭐ Validate email before creating payment link
    if (!isValidEmail(order.contactEmail)) {
      console.warn('⚠️ Invalid email for payment link:', order.contactEmail);
      // Still allow creation but warn
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
      receipt_email: order.contactEmail || undefined,
    });

    // Store the payment intent ID
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

    const responseData = {
      clientSecret: paymentIntent.client_secret,
      paymentLink: paymentIntent.client_secret,
      paymentId: payment._id,
    };

    // ⭐ Add warning if no valid email
    if (!isValidEmail(order.contactEmail)) {
      responseData.warning = 'No valid customer email address found. Please update the order with a valid email for receipt delivery.';
    }

    res.json({
      success: true,
      data: responseData,
      message: `Payment link generated successfully${!isValidEmail(order.contactEmail) ? ' (⚠️ No email set)' : ''}`
    });

  } catch (error) {
    console.error('Generate payment link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ Download receipt as PDF — placed BEFORE the generic /:paymentId route
router.get('/:paymentId/receipt', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'orderId',
        select: 'orderNumber contactName contactEmail companyName totalAmount balanceDue'
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be generated for completed payments'
      });
    }

    const order = payment.orderId || {};
    const receiptNo = payment.receiptNumber || payment.paymentNo || payment._id.toString().slice(-8);

    // Set headers before streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Receipt-${receiptNo}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // ── Header ──
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Payment Receipt', { align: 'center' })
      .moveDown(1.5);

    // ── Receipt meta ──
    doc.fontSize(10).font('Helvetica').fillColor('#555');
    doc.text(`Receipt No: ${receiptNo}`);
    doc.text(`Payment Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}`);
    doc.text(`Order No: ${order.orderNumber || 'N/A'}`);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(1);

    // ── Bill to ──
    doc.fillColor('#111').fontSize(12).font('Helvetica-Bold').text('Billed To');
    doc.fontSize(10).font('Helvetica').fillColor('#555');
    doc.text(order.contactName || 'N/A');
    doc.text(order.companyName || '');
    doc.text(order.contactEmail || '');
    doc.moveDown(1.5);

    // ── Payment details table ──
    doc.fillColor('#111').fontSize(12).font('Helvetica-Bold').text('Payment Details');
    doc.moveDown(0.5);

    const rows = [
      ['Amount Paid', `$${payment.amount?.toFixed(2) || '0.00'}`],
      ['Method', (payment.method || 'N/A').replace(/_/g, ' ')],
      ['Reference / TXN ID', payment.reference || payment.transactionId || '—'],
      ['Status', payment.status],
      ['Recorded By', payment.userId?.firstName
        ? `${payment.userId.firstName} ${payment.userId.lastName || ''}`.trim()
        : 'System'],
      ['Notes', payment.notes || '—'],
    ];

    doc.fontSize(10).font('Helvetica');
    rows.forEach(([label, value]) => {
      doc.fillColor('#888').text(label, 50, doc.y, { continued: true, width: 200 });
      doc.fillColor('#111').text(`  ${value}`, { width: 300 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(1);

    // ── Footer ──
    doc
      .fontSize(9)
      .fillColor('#999')
      .text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('❌ Download receipt error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.end();
    }
  }
});

// Get payment by ID - MUST come LAST (after all specific routes)
router.get('/:paymentId', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'orderId',
        select: 'orderNumber contactName contactEmail companyName totalAmount amountPaid balanceDue status progress paymentStatus dealId'
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // ⭐ Fetch invoice separately if invoiceId exists
    let invoiceData = null;
    if (payment.invoiceId) {
      try {
        const invoice = await Invoice.findById(payment.invoiceId)
          .select('invoiceNumber totalAmount status issueDate dueDate');
        if (invoice) {
          invoiceData = invoice;
        }
      } catch (invoiceError) {
        console.warn('⚠️ Could not fetch invoice:', invoiceError.message);
      }
    }

    // ⭐ Fetch deal separately if needed
    let dealData = null;
    if (payment.orderId && payment.orderId.dealId) {
      try {
        const deal = await Deal.findById(payment.orderId.dealId)
          .select('name amount status');
        if (deal) {
          dealData = deal;
        }
      } catch (dealError) {
        console.warn('⚠️ Could not fetch deal:', dealError.message);
      }
    }

    // Get activities
    const activities = await Activity.find({ payment: payment._id })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // ⭐ Combine all data
    const paymentData = payment.toObject();
    if (invoiceData) {
      paymentData.invoice = invoiceData;
    }
    if (dealData) {
      paymentData.deal = dealData;
    }

    res.json({ 
      success: true, 
      data: {
        ...paymentData,
        activities
      } 
    });

  } catch (error) {
    console.error('❌ Get payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;