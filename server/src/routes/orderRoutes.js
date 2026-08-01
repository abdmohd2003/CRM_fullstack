// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Deal = require('../models/Deal');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const { 
  createActivity, 
  createNotification, 
  updateOrderPaymentStatus,
  sendOrderConfirmationEmail
} = require('../utils/orderHelpers');
const { protect } = require('../middleware/auth.middleware');

// ⭐ Helper function to validate email
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// ============================================
// 📌 SPECIFIC ROUTES FIRST (with params)
// ============================================

// GET all orders
router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('dealId')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const [payments, invoice] = await Promise.all([
        Payment.find({ orderId: order._id })
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 }),
        Invoice.findOne({ orderId: order._id })
      ]);
      
      return {
        ...order.toObject(),
        payments,
        invoice,
        progress: order.progress
      };
    }));

    res.json({ 
      success: true, 
      data: { 
        orders: ordersWithDetails,
        total: ordersWithDetails.length
      } 
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ CONFIRM Order (Step 3)
router.patch('/:orderId/confirm', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;
    const { sendEmail = true } = req.body;

    const order = await Order.findById(orderId).populate('dealId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'DRAFT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft orders can be confirmed' 
      });
    }

    order.status = 'CONFIRMED';
    order.confirmedAt = new Date();
    await order.save();

    await Activity.create({
      order: order._id,
      type: 'Order',
      itemRef: order._id,
      description: `Order ${order.orderNumber} confirmed`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'ORDER_CONFIRMED',
      metadata: { confirmedBy: userId }
    });

    await Notification.create({
      userId: order.userId,
      title: '✅ Order Confirmed',
      message: `Order ${order.orderNumber} has been confirmed`,
      type: 'ORDER_CONFIRMED',
      link: `/orders/${order._id}`,
      metadata: { orderId: order._id },
      read: false,
    });

    let emailSent = false;
    let emailMessage = '';
    
    if (sendEmail) {
      const emailTo = order.contactEmail;
      if (isValidEmail(emailTo)) {
        try {
          await sendOrderConfirmationEmail(emailTo, order);
          emailSent = true;
          emailMessage = `Confirmation email sent to ${emailTo}`;
        } catch (emailError) {
          console.error('⚠️ Failed to send confirmation email:', emailError.message);
          emailMessage = 'Failed to send confirmation email';
        }
      } else {
        emailMessage = 'No valid email address for confirmation.';
      }
    }

    res.json({
      success: true,
      data: { order, emailSent, emailMessage },
      message: `Order confirmed successfully. ${emailMessage}`
    });

  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ COMPLETE Order (Mark as completed/delivered)
router.patch('/:orderId/complete', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completedAt } = req.body;
    const userId = req.user._id || req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only PAID orders can be marked as completed
    if (order.status !== 'PAID') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be PAID before marking as completed' 
      });
    }

    order.completedAt = new Date(completedAt || Date.now());
    order.status = 'COMPLETED';
    await order.save();

    await Activity.create({
      order: order._id,
      type: 'Order',
      itemRef: order._id,
      description: `Order ${order.orderNumber} marked as completed/delivered`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'ORDER_COMPLETED',
      metadata: { 
        completedAt: order.completedAt,
        completedBy: userId 
      }
    });

    await Notification.create({
      userId: order.userId,
      title: '📦 Order Completed',
      message: `Order ${order.orderNumber} has been marked as completed/delivered`,
      type: 'ORDER_COMPLETED',
      link: `/orders/${order._id}`,
      metadata: { orderId: order._id },
      read: false,
    });

    res.json({
      success: true,
      data: order,
      message: 'Order marked as completed successfully'
    });
  } catch (error) {
    console.error('Mark order completed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ CANCEL Order
router.patch('/:orderId/cancel', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Paid or cancelled orders cannot be cancelled' 
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    await Activity.create({
      order: order._id,
      type: 'Order',
      itemRef: order._id,
      description: `Order ${order.orderNumber} cancelled`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'ORDER_CANCELLED',
      metadata: { cancelledBy: userId }
    });

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ UPDATE Email Only
router.patch('/:orderId/email', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body;
    const userId = req.user._id || req.user.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: `Invalid email address format: ${email}`
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.contactEmail = email;
    await order.save();

    await Activity.create({
      order: order._id,
      type: 'Order',
      itemRef: order._id,
      description: `Order email updated to ${email}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'ORDER_UPDATED',
      metadata: { updatedField: 'contactEmail', newValue: email }
    });

    res.json({
      success: true,
      data: order,
      message: `Order email updated to ${email}`
    });

  } catch (error) {
    console.error('Update order email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ UPDATE Order
router.patch('/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lineItems, ...orderData } = req.body;
    const userId = req.user._id || req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (lineItems && lineItems.length > 0) {
      let subtotal = 0;
      
      const updatedLineItems = lineItems.map(item => {
        const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        subtotal += lineTotal;
        return {
          ...item,
          lineTotal
        };
      });

      const taxAmount = subtotal * (orderData.taxRate || order.taxRate || 15) / 100;
      const totalAmount = subtotal + taxAmount;

      order.lineItems = updatedLineItems;
      order.subtotal = subtotal;
      order.taxAmount = taxAmount;
      order.totalAmount = totalAmount;
      
      Object.assign(order, orderData);
      
      const payments = await Payment.find({
        orderId: order._id,
        status: 'COMPLETED'
      });
      const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      order.amountPaid = amountPaid;
      order.balanceDue = totalAmount - amountPaid;
      order.progressPercentage = order.progress;
      
      await order.save();
    } else {
      if (orderData.contactEmail) {
        if (!isValidEmail(orderData.contactEmail)) {
          return res.status(400).json({
            success: false,
            message: `Invalid email address format: ${orderData.contactEmail}`
          });
        }
      }
      Object.assign(order, orderData);
      await order.save();
    }

    await Activity.create({
      order: order._id,
      type: 'Order',
      itemRef: order._id,
      description: 'Order details updated',
      activityDate: new Date(),
      createdBy: userId,
      action: 'ORDER_UPDATED',
      metadata: { updatedFields: Object.keys(orderData) }
    });

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ DELETE Order
router.delete('/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a paid or completed order' 
      });
    }

    await Payment.deleteMany({ orderId: order._id });
    await Invoice.deleteOne({ orderId: order._id });
    await Activity.deleteMany({ order: order._id });
    await Order.findByIdAndDelete(orderId);

    res.json({ 
      success: true, 
      message: `Order ${order.orderNumber} deleted successfully` 
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⭐ GET Order by ID - MUST BE LAST (generic route)
router.get('/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('dealId')
      .populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [payments, invoice, activities] = await Promise.all([
      Payment.find({ orderId: order._id })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 }),
      Invoice.findOne({ orderId: order._id }),
      Activity.find({ order: order._id })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    res.json({ 
      success: true, 
      data: {
        ...order.toObject(),
        payments,
        invoice,
        activities,
        progress: order.progress
      } 
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;