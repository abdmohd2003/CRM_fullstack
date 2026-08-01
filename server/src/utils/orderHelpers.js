// utils/orderHelpers.js
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Deal = require('../models/Deal');
const emailService = require('../services/email.service');

// Round to 2 decimal places, guarding against IEEE-754 float drift
// (e.g. 8280 - 8279.98 => 0.019999999999982 instead of 0.02).
// Used everywhere money is summed or subtracted in this file.
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Generate order number
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments();
  const sequence = count + 1;
  return `ORD-${year}-${String(sequence).padStart(4, '0')}`;
}

// Generate invoice number
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${year}` }
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    sequence = parseInt(parts[2]) + 1;
  }

  return `INV-${year}-${String(sequence).padStart(4, '0')}`;
}

// Generate receipt number
function generateReceiptNumber() {
  return `RCPT-${Date.now().toString(36).toUpperCase()}`;
}

// Create activity log
async function createActivity(data) {
  try {
    const activityData = {
      type: 'Order',
      itemRef: data.orderId || data.dealId || data.paymentId || data.invoiceId,
      description: data.description,
      activityDate: new Date(),
      createdBy: data.userId,
      action: data.action,
      metadata: data.metadata || null,
    };

    if (data.orderId) activityData.order = data.orderId;
    if (data.dealId) activityData.deal = data.dealId;
    if (data.paymentId) activityData.payment = data.paymentId;
    if (data.invoiceId) activityData.invoice = data.invoiceId;

    const activity = new Activity(activityData);
    return await activity.save();
  } catch (error) {
    console.error('Create activity error:', error);
    throw error;
  }
}

// Create notification
async function createNotification(data) {
  try {
    const notification = new Notification({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link || null,
      metadata: data.metadata || null,
      read: false,
    });
    return await notification.save();
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}

// Update order payment status
async function updateOrderPaymentStatus(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    const payments = await Payment.find({
      orderId: orderId,
      status: 'COMPLETED'
    });

    // Round each payment amount before summing, and round the running
    // total after every addition. Summing raw floats (even ones that look
    // like clean 2-decimal values, e.g. 8279.98) can accumulate binary
    // rounding drift, which then shows up as a phantom balanceDue like
    // $0.02/$0.03 even after what looks like a "full" payment.
    const amountPaid = round2(
      payments.reduce((sum, p) => round2(sum + round2(p.amount)), 0)
    );
    const totalAmount = round2(order.totalAmount);
    const balanceDue = round2(totalAmount - amountPaid);

    let status = order.status;

    // Treat anything within half a cent as fully paid — this is a
    // tolerance for residual float noise, not a discount. Real unpaid
    // balances (e.g. 0.02+) still correctly fall through to PARTIAL.
    if (status !== 'CANCELLED') {
      if (balanceDue <= 0.005) {
        status = 'PAID';
        order.paidAt = new Date();
      } else if (amountPaid > 0) {
        status = 'PARTIAL';
      } else {
        if (status === 'PARTIAL' || status === 'PAID') {
          status = order.invoiceNumber ? 'INVOICED' : 'CONFIRMED';
        }
      }
    }

    order.amountPaid = amountPaid;
    order.balanceDue = Math.max(0, balanceDue);
    order.status = status;
    order.progressPercentage = order.progress;

    await order.save();
    return order;
  } catch (error) {
    console.error('Update order payment status error:', error);
    throw error;
  }
}

// Create order from deal
async function createOrderFromDeal(dealId, userId) {
  try {
    const deal = await Deal.findById(dealId)
      .populate("owner")
      .populate({
        path: "associatedLead",
        populate: [
          {
            path: "company",
            model: "Company",
          },
          {
            path: "products",
            model: "Product",
          },
        ],
      });

    if (!deal) {
      throw new Error("Deal not found");
    }

    console.log("📦 Creating order from deal:", deal.name);

    let leadEmail = "";
    let leadName = "";
    let leadCompany = "";
    let leadPhone = "";

    if (deal.associatedLead && deal.associatedLead.length > 0) {
      const lead = deal.associatedLead[0];

      leadEmail = lead.email || "";

      leadName =
        `${lead.firstName || ""} ${lead.lastName || ""}`.trim();

      leadPhone = lead.phone || "";

      if (lead.company && typeof lead.company === "object") {
        leadCompany =
          lead.company.name ||
          lead.company.companyName ||
          "";
      } else {
        leadCompany = lead.company || "";
      }

      console.log("✅ Lead Products:", lead.products);
    }

    const owner =
      deal.owner && deal.owner.length > 0
        ? deal.owner[0]
        : null;

    const ownerId = owner ? owner._id : userId;

    const contactEmail =
      leadEmail || owner?.email || "";

    const contactName =
      leadName ||
      `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() ||
      "Unknown Customer";

    const contactPhone = leadPhone;

    const companyName =
      leadCompany || "Unknown Company";

    const orderNumber = await generateOrderNumber();

    // -----------------------------
    // Build Line Items
    // -----------------------------

    const lineItems = [];
    let subtotal = 0;

    if (
      deal.associatedLead &&
      deal.associatedLead.length > 0 &&
      deal.associatedLead[0].products &&
      deal.associatedLead[0].products.length > 0
    ) {
      deal.associatedLead[0].products.forEach((product) => {
        const price = round2(Number(product.amount || 0));

        lineItems.push({
          productName: product.name,
          description: product.description || "",
          quantity: 1,
          unitPrice: price,
          discount: 0,
          lineTotal: price,
        });

        subtotal = round2(subtotal + price);
      });
    } else {
      console.warn("⚠️ No products found. Using deal as fallback.");

      const price = round2(Number(deal.amount || 0));

      lineItems.push({
        productName: deal.name,
        description: `Deal: ${deal.name}`,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        lineTotal: price,
      });

      subtotal = price;
    }

    const taxRate = 15;
    // Round tax and total so downstream balance math always starts from
    // clean 2-decimal figures instead of a float like 1080.0000000000002.
    const taxAmount = round2(subtotal * (taxRate / 100));
    const totalAmount = round2(subtotal + taxAmount);

    // -----------------------------
    // Create Order
    // -----------------------------

    const order = new Order({
      orderNumber,

      status: "DRAFT",

      dealId: deal._id,

      userId: ownerId,

      companyName,

      contactName,

      contactEmail,

      contactPhone,

      subtotal,

      taxRate,

      taxAmount,

      totalAmount,

      amountPaid: 0,

      balanceDue: totalAmount,

      paymentDueDate: generateDueDate(),

      lineItems,

      progressPercentage: 0,
    });

    await order.save();

    deal.orderId = order._id;
    await deal.save();

    console.log("✅ Order Created:", order.orderNumber);

    return order;
  } catch (error) {
    console.error("❌ Create order from deal error:", error);
    throw error;
  }
}

// ============ EMAIL HELPER FUNCTIONS ============

async function sendOrderConfirmationEmail(email, order) {
  try {
    if (!email || email === '') {
      console.log('⚠️ No email address provided, skipping order confirmation');
      return { success: false, message: 'No email address' };
    }
    return await emailService.sendOrderConfirmationEmail(email, order);
  } catch (error) {
    console.error('Send order confirmation email error:', error);
    return false;
  }
}

async function sendInvoiceEmail({ to, subject, body, invoice, order }) {
  try {
    if (!to || to === '' || to === 'unknown@email.com') {
      console.warn('⚠️ Invalid email address:', to);
      return {
        success: false,
        message: 'No valid customer email address.'
      };
    }
    return await emailService.sendInvoiceEmail({ to, subject, body, invoice, order });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return false;
  }
}

async function sendPaymentReceipt(email, payment, order) {
  try {
    if (!email || email === '' || email === 'unknown@email.com') {
      console.log('⚠️ No valid email address, skipping payment receipt');
      return { success: false, message: 'No email address' };
    }
    return await emailService.sendPaymentReceipt(email, payment, order);
  } catch (error) {
    console.error('Send payment receipt email error:', error);
    return false;
  }
}

async function triggerERPWebhook(orderId, event) {
  try {
    return await emailService.triggerERPWebhook(orderId, event);
  } catch (error) {
    console.error('Trigger ERP webhook error:', error);
    return false;
  }
}

// ============ ADDITIONAL HELPER FUNCTIONS ============

function calculateOrderTotals(lineItems, taxRate = 15) {
  let subtotal = 0;

  const updatedLineItems = lineItems.map(item => {
    const lineTotal = round2(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100));
    subtotal = round2(subtotal + lineTotal);
    return {
      ...item,
      lineTotal
    };
  });

  const taxAmount = round2(subtotal * (taxRate / 100));
  const totalAmount = round2(subtotal + taxAmount);

  return {
    lineItems: updatedLineItems,
    subtotal,
    taxAmount,
    totalAmount
  };
}

async function getOrderPaymentSummary(orderId) {
  try {
    const payments = await Payment.find({
      orderId: orderId,
      status: 'COMPLETED'
    });

    const totalPaid = round2(
      payments.reduce((sum, p) => round2(sum + round2(p.amount)), 0)
    );
    const paymentCount = payments.length;
    const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    return {
      totalPaid,
      paymentCount,
      lastPayment,
      payments
    };
  } catch (error) {
    console.error('Get order payment summary error:', error);
    return {
      totalPaid: 0,
      paymentCount: 0,
      lastPayment: null,
      payments: []
    };
  }
}

function canConfirmOrder(order) {
  if (!order) return false;
  if (order.status !== 'DRAFT') return false;
  if (!order.lineItems || order.lineItems.length === 0) return false;
  if (order.totalAmount <= 0) return false;
  return true;
}

function canGenerateInvoice(order) {
  if (!order) return false;
  if (order.status !== 'CONFIRMED' && order.status !== 'INVOICED') return false;
  if (order.invoiceNumber) return false;
  return true;
}

// Check if order can be marked as completed
function canMarkOrderCompleted(order) {
  if (!order) return false;
  if (order.status !== 'PAID') return false;
  if (order.completedAt) return false;
  return true;
}

// Check if order is completed
function isOrderCompleted(order) {
  if (!order) return false;
  return order.status === 'COMPLETED' && order.completedAt !== null;
}

// Mark order as completed
async function markOrderCompleted(orderId, userId, completedAt = null) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PAID') {
      throw new Error('Order must be PAID before marking as completed');
    }

    order.completedAt = new Date(completedAt || Date.now());
    order.status = 'COMPLETED';
    await order.save();

    await createActivity({
      orderId: order._id,
      userId: userId,
      description: `Order ${order.orderNumber} marked as completed/delivered`,
      action: 'ORDER_COMPLETED',
      metadata: {
        completedAt: order.completedAt,
        completedBy: userId
      }
    });

    await createNotification({
      userId: order.userId,
      title: '📦 Order Completed',
      message: `Order ${order.orderNumber} has been marked as completed/delivered`,
      type: 'ORDER_COMPLETED',
      link: `/orders/${order._id}`,
      metadata: { orderId: order._id }
    });

    console.log(`✅ Order ${order.orderNumber} marked as completed`);
    return order;
  } catch (error) {
    console.error('Mark order completed error:', error);
    throw error;
  }
}

// Get days since completion
function getDaysSinceCompletion(order) {
  if (!order || !order.completedAt) return null;
  const now = new Date();
  const completed = new Date(order.completedAt);
  const diffTime = Math.abs(now - completed);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get days until due date
function getDaysUntilDue(order) {
  if (!order || !order.paymentDueDate) return null;
  const now = new Date();
  const due = new Date(order.paymentDueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getOrderStatusBadge(status) {
  const colors = {
    'DRAFT': 'bg-gray-100 text-gray-800',
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'INVOICED': 'bg-indigo-100 text-indigo-800',
    'PARTIAL': 'bg-yellow-100 text-yellow-800',
    'PAID': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-emerald-100 text-emerald-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPaymentStatusBadge(status) {
  const colors = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
    'REFUNDED': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function generateDueDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getUserFullName(user) {
  if (!user) return 'Unknown User';
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  return user.email || 'Unknown User';
}

function getDealOwner(deal) {
  if (!deal) return null;
  if (deal.owner && deal.owner.length > 0) {
    return deal.owner[0];
  }
  return null;
}

function validateEmail(email) {
  if (!email) return { valid: false, email: '' };
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    valid: emailRegex.test(trimmed),
    email: trimmed
  };
}

function getCustomerEmail(order) {
  if (!order) return null;

  const emails = [
    order.contactEmail,
    order.email,
    order.customerEmail,
    order.userId?.email,
  ].filter(Boolean);

  for (const email of emails) {
    const { valid, email: cleanEmail } = validateEmail(email);
    if (valid) return cleanEmail;
  }

  return null;
}

module.exports = {
  // Core functions
  generateOrderNumber,
  generateInvoiceNumber,
  generateReceiptNumber,
  createActivity,
  createNotification,
  updateOrderPaymentStatus,
  createOrderFromDeal,

  // Email functions
  sendOrderConfirmationEmail,
  sendInvoiceEmail,
  sendPaymentReceipt,
  triggerERPWebhook,

  // Order helpers
  calculateOrderTotals,
  getOrderPaymentSummary,
  canConfirmOrder,
  canGenerateInvoice,
  markOrderCompleted,
  canMarkOrderCompleted,
  isOrderCompleted,
  getDaysSinceCompletion,
  getDaysUntilDue,

  // UI helpers
  getOrderStatusBadge,
  getPaymentStatusBadge,
  formatCurrency,
  generateDueDate,
  getUserFullName,
  getDealOwner,

  // Email helpers
  validateEmail,
  getCustomerEmail,
};