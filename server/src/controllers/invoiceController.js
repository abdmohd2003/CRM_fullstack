// controllers/invoiceController.js
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const { 
  generateInvoiceNumber,
  sendInvoiceEmail
} = require("../utils/orderHelpers");

// server/controllers/invoiceController.js

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id || req.user?.id || 'system';

    // ⭐ Validate orderId
    if (!orderId || orderId === 'undefined') {
      console.error('❌ Invalid orderId:', orderId);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // ⭐ Check if order exists
    const order = await Order.findById(orderId)
      .populate('dealId')
      .populate('userId', 'firstName lastName email');

    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ⭐ Check if order is in correct status
    if (order.status !== 'CONFIRMED' && order.status !== 'INVOICED') {
      return res.status(400).json({
        success: false,
        message: 'Order must be confirmed before generating invoice'
      });
    }

    // ⭐ FIX: Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ orderId: order._id });
    
    if (existingInvoice) {
      console.log('📄 Invoice already exists for order:', orderId);
      return res.status(400).json({
        success: false,
        message: `Invoice ${existingInvoice.invoiceNumber} already generated for this order`,
        data: {
          invoice: existingInvoice
        }
      });
    }

    // Check if order already has invoice number
    if (order.invoiceNumber) {
      console.log('📄 Order already has invoice number:', order.invoiceNumber);
      return res.status(400).json({
        success: false,
        message: `Invoice ${order.invoiceNumber} already generated for this order`,
        data: {
          invoiceNumber: order.invoiceNumber
        }
      });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Set due date (default 30 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

 // Create invoice
const invoice = new Invoice({
  invoiceNumber,
  orderId: order._id,
  dueDate,
  paymentLink: req.body.paymentLink || null,
  billTo: {
    name: order.contactName,
    company: order.companyName,
    email: order.contactEmail,
    phone: order.contactPhone,
  },
  bankDetails: {
    accountName: process.env.BANK_ACCOUNT_NAME || "CRM Platform",
    iban: process.env.BANK_IBAN || "XX00 0000 0000 0000 0000",
    routing: process.env.BANK_ROUTING || "000000000",
    reference: invoiceNumber,
  },
  taxRate: order.taxRate,
});

await invoice.save();

// Generate PDF
const pdfUrl = await generateInvoicePDF(invoice._id);

// Update invoice with PDF URL
invoice.pdfUrl = pdfUrl;
await invoice.save();

// ⭐⭐⭐ Update Order with Invoice Reference
order.status = "INVOICED";
order.invoiceId = invoice._id;          // <-- ADD THIS
order.invoiceNumber = invoice.invoiceNumber;
order.invoiceGeneratedAt = new Date();




 
    await order.save();

    // Log activity
    await Activity.create({
      order: order._id,
      invoice: invoice._id,
      type: 'Invoice',
      itemRef: invoice._id,
      description: `Invoice ${invoiceNumber} generated for order ${order.orderNumber}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'INVOICE_GENERATED',
      metadata: { invoiceNumber, invoiceId: invoice._id }
    });

    // Create notification
    await Notification.create({
      userId: order.userId,
      title: '📄 Invoice Generated',
      message: `Invoice ${invoiceNumber} has been generated for order ${order.orderNumber}`,
      type: 'INVOICE_READY',
      link: `/invoices/${invoice._id}`,
      metadata: { orderId: order._id, invoiceId: invoice._id },
      read: false,
    });

    res.json({
      success: true,
      data: {
        invoice,
        order,
        pdfUrl
      },
      message: `Invoice ${invoiceNumber} generated successfully`
    });

  } catch (error) {
    console.error('❌ Generate invoice error:', error);
    
    // ⭐ Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An invoice already exists for this order'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Send invoice email (Step 5)
const sendInvoiceEmail = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { email, subject, message } = req.body;
    const userId = req.user?._id || req.user?.id || 'system';

    const invoice = await Invoice.findById(invoiceId).populate({
      path: 'orderId',
      populate: { path: 'dealId' }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const order = invoice.orderId;
    const to = email || order.contactEmail;
    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from CRM Platform`;
    const emailBody = message || `Dear ${order.contactName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your order ${order.orderNumber}.\n\nAmount Due: $${order.balanceDue.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business.`;

    // Send email with PDF attachment
    await sendInvoiceEmail({
      to,
      subject: emailSubject,
      body: emailBody,
      invoice,
      order
    });

    // Update invoice sent status
    invoice.isSent = true;
    invoice.sentAt = new Date();
    await invoice.save();

    // Log activity - using your schema
    await Activity.create({
      order: order._id,
      invoice: invoice._id,
      type: 'Invoice',
      itemRef: invoice._id,
      description: `Invoice ${invoice.invoiceNumber} emailed to ${to}`,
      activityDate: new Date(),
      createdBy: userId,
      action: 'INVOICE_EMAILED',
      metadata: { recipient: to }
    });

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent successfully to ${to}`
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: 'orderId',
        populate: [
          { path: 'dealId' },
          { path: 'lineItems' },
          { path: 'payments', model: 'Payment' },
          { path: 'userId', select: 'firstName lastName email' }
        ]
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get invoice by order
const getInvoiceByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await Invoice.findOne({ orderId })
      .populate({
        path: 'orderId',
        populate: [
          { path: 'dealId' },
          { path: 'lineItems' },
          { path: 'payments', model: 'Payment' }
        ]
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found for this order' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice by order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Preview invoice
const previewInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: 'orderId',
        populate: [
          { path: 'dealId' },
          { path: 'lineItems' }
        ]
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Preview invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download invoice PDF
const downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({ success: false, message: 'PDF not generated yet' });
    }

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', invoice.pdfUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found' });
    }

    res.download(filePath, `invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateInvoice,
  sendInvoiceEmail,
  getInvoiceById,
  getInvoiceByOrder,
  previewInvoice,
  downloadInvoice,
};