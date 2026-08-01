// controllers/orderController.js
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const Invoice = require("../models/Invoice");
const { updateOrderPaymentStatus } = require("../utils/orderHelpers");

// Small helper so every controller logs side-effect failures the same way
// without ever throwing / failing the parent request.
const safeSideEffect = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    console.error(`${label} failed (non-critical):`, err.message);
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
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

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('dealId', 'name amount')
        .populate('userId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    const ordersWithProgress = orders.map(order => ({
      ...order.toObject(),
      progress: order.progress
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: ordersWithProgress,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('dealId')
      .populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Get payments
    const payments = await Payment.find({ orderId: order._id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get activities
    const activities = await Activity.find({ order: order._id })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get invoice
    const invoice = await Invoice.findOne({ orderId: order._id });

    res.status(200).json({
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

// Confirm order (Step 3)
const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id || req.user?.id || 'system';

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

    // Update order status — core write, must succeed
    order.status = 'CONFIRMED';
    order.confirmedAt = new Date();
    await order.save();

    // Side effects — never let these fail the response
    await safeSideEffect('Activity log (ORDER_CONFIRMED)', () =>
      Activity.create({
        order: order._id,
        type: 'Order',
        itemRef: order._id,
        description: `Order ${order.orderNumber} confirmed`,
        activityDate: new Date(),
        createdBy: userId,
        action: 'ORDER_CONFIRMED',
        metadata: { confirmedBy: userId }
      })
    );

    await safeSideEffect('Notification create (ORDER_CONFIRMED)', () =>
      Notification.create({
        userId: order.userId,
        title: '✅ Order Confirmed',
        message: `Order ${order.orderNumber} has been confirmed`,
        type: 'ORDER_CONFIRMED',
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
        read: false,
      })
    );

    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order confirmed successfully. You can now generate an invoice.'
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark order completed (final step)
const markOrderCompleted = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completedAt } = req.body;
    const userId = req.user?._id || req.user?.id || 'system';

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        data: order,
        message: 'Order was already marked as completed'
      });
    }

    // Only PAID orders can be marked as completed
    if (order.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: `Order must be PAID before marking as completed (current status: ${order.status})`
      });
    }

    // Update order — core write, must succeed
    order.completedAt = new Date(completedAt || Date.now());
    order.status = 'COMPLETED';
    await order.save();

    // Side effects — never let these fail the response
    await safeSideEffect('Activity log (ORDER_COMPLETED)', () =>
      Activity.create({
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
      })
    );

    await safeSideEffect('Notification create (ORDER_COMPLETED)', () =>
      Notification.create({
        userId: order.userId,
        title: '📦 Order Completed',
        message: `Order ${order.orderNumber} has been marked as completed/delivered`,
        type: 'ORDER_COMPLETED',
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
        read: false,
      })
    );

    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order marked as completed successfully'
    });
  } catch (error) {
    console.error('Mark order completed error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lineItems, ...orderData } = req.body;
    const userId = req.user?._id || req.user?.id || 'system';

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Recalculate totals if line items updated
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

      // Recalculate balance due
      const payments = await Payment.find({
        orderId: order._id,
        status: 'COMPLETED'
      });
      const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      order.amountPaid = amountPaid;
      order.balanceDue = totalAmount - amountPaid;
      order.progressPercentage = order.progress;

      await order.save(); // core write, must succeed
    } else {
      Object.assign(order, orderData);
      await order.save(); // core write, must succeed
    }

    // Side effect — never let this fail the response
    await safeSideEffect('Activity log (ORDER_UPDATED)', () =>
      Activity.create({
        order: order._id,
        type: 'Order',
        itemRef: order._id,
        description: 'Order details updated',
        activityDate: new Date(),
        createdBy: userId,
        action: 'ORDER_UPDATED',
        metadata: { updatedFields: Object.keys(orderData) }
      })
    );

    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id || req.user?.id || 'system';

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

    // Core write, must succeed
    order.status = 'CANCELLED';
    await order.save();

    // Side effect — never let this fail the response
    await safeSideEffect('Activity log (ORDER_CANCELLED)', () =>
      Activity.create({
        order: order._id,
        type: 'Order',
        itemRef: order._id,
        description: `Order ${order.orderNumber} cancelled`,
        activityDate: new Date(),
        createdBy: userId,
        action: 'ORDER_CANCELLED',
        metadata: { cancelledBy: userId }
      })
    );

    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderPayments,
  confirmOrder,
  markOrderCompleted,
  updateOrder,
  cancelOrder,
};