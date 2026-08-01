// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { generateInvoiceNumber, sendInvoiceEmail } = require('../utils/orderHelpers');

// Import the entire email service
const emailService = require('../services/email.service');

const { protect } = require('../middleware/auth.middleware');

// ⭐ Helper function to validate email
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// STEP 4: Generate Invoice
router.post('/generate/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log('📝 Generating invoice for orderId:', orderId);

    const order = await Order.findById(orderId)
      .populate('dealId')
      .populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'INVOICED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be confirmed before generating invoice' 
      });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: order._id });
    if (existingInvoice) {
      return res.status(400).json({ 
        success: false, 
        message: `Invoice ${existingInvoice.invoiceNumber} already generated for this order`,
        data: { invoice: existingInvoice }
      });
    }

    if (order.invoiceNumber) {
      return res.status(400).json({ 
        success: false, 
        message: `Invoice ${order.invoiceNumber} already generated for this order` 
      });
    }

    // ⭐ Check if order has a valid email
    if (!isValidEmail(order.contactEmail)) {
      console.warn('⚠️ Order has no valid email for invoice:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        contactEmail: order.contactEmail
      });
      // Still allow invoice generation, but warn the user
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
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
        accountName: process.env.BANK_ACCOUNT_NAME || 'CRM Platform',
        iban: process.env.BANK_IBAN || 'XX00 0000 0000 0000 0000',
        routing: process.env.BANK_ROUTING || '000000000',
        reference: invoiceNumber,
      },
      taxRate: order.taxRate || 15,
    });

    await invoice.save();

    // Generate PDF
    const pdfUrl = await emailService.generateInvoicePDF(invoice._id);

    // Update invoice with PDF URL
    invoice.pdfUrl = pdfUrl;
    await invoice.save();

    // Update order
    order.status = 'INVOICED';
    order.invoiceNumber = invoiceNumber;
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

    // ⭐ If no email, add warning to response
    const responseData = {
      invoice,
      order,
      pdfUrl
    };

    if (!isValidEmail(order.contactEmail)) {
      responseData.warning = 'No valid customer email address found. Please update the order with a valid email before sending.';
    }

    res.json({
      success: true,
      data: responseData,
      message: `Invoice ${invoiceNumber} generated successfully${!isValidEmail(order.contactEmail) ? ' (⚠️ No email set)' : ''}`
    });

  } catch (error) {
    console.error('❌ Generate invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// STEP 5: Send Invoice by Email
router.post('/:invoiceId/send-email', protect, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { email, subject, message } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('📧 Sending invoice email for invoiceId:', invoiceId);

    const invoice = await Invoice.findById(invoiceId).populate({
      path: 'orderId',
      populate: { path: 'dealId' }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const order = invoice.orderId;
    
    // ⭐ Determine the recipient email
    let to = email || order.contactEmail;
    
    // ⭐ Validate email
    if (!to || to === '' || to === 'unknown@email.com') {
      console.warn('⚠️ No valid email address for invoice:', {
        invoiceId: invoice._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        contactEmail: order.contactEmail,
        requestedEmail: email
      });
      
      return res.status(400).json({
        success: false,
        message: 'No valid customer email address. Please update the order with a valid email.',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          currentEmail: order.contactEmail || 'Not set'
        }
      });
    }

    // ⭐ Validate email format
    if (!isValidEmail(to)) {
      return res.status(400).json({
        success: false,
        message: `Invalid email address format: ${to}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          email: to
        }
      });
    }

    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from CRM Platform`;
    const emailBody = message || `Dear ${order.contactName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your order ${order.orderNumber}.\n\nAmount Due: $${order.balanceDue?.toFixed(2) || order.totalAmount?.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business.`;

    // Send email with PDF attachment
    await emailService.sendInvoiceEmail({
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

    // Log activity
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

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent successfully to ${to}`
    });

  } catch (error) {
    console.error('❌ Send invoice email error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send invoice email' 
    });
  }
});

// ⭐ Get invoice by order ID - MUST COME BEFORE /:invoiceId
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('📦 Fetching invoice for orderId:', orderId);

    const invoice = await Invoice.findOne({ orderId })
      .populate({
        path: 'orderId',
        populate: [
          { path: 'dealId' },
          { path: 'lineItems' }
        ]
      });

    if (!invoice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found for this order' 
      });
    }

    // Fetch payments separately
    const payments = await Payment.find({ orderId: invoice.orderId._id })
      .populate('userId', 'firstName lastName email');

    const responseData = {
      ...invoice.toObject(),
      orderId: {
        ...invoice.orderId.toObject(),
        payments: payments
      }
    };

    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Get invoice by order error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get invoice by ID
router.get('/:invoiceId', protect, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    console.log('📄 Fetching invoice by ID:', invoiceId);

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

    // Fetch payments separately
    const payments = await Payment.find({ orderId: invoice.orderId._id })
      .populate('userId', 'firstName lastName email');

    const responseData = {
      ...invoice.toObject(),
      orderId: {
        ...invoice.orderId.toObject(),
        payments: payments
      }
    };

    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Get invoice error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Preview invoice
router.get('/:invoiceId/preview', protect, async (req, res) => {
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

    // Fetch payments separately
    const payments = await Payment.find({ orderId: invoice.orderId._id });

    const responseData = {
      ...invoice.toObject(),
      orderId: {
        ...invoice.orderId.toObject(),
        payments: payments
      }
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('❌ Preview invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download invoice PDF
router.get('/:invoiceId/download', protect, async (req, res) => {
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
    console.error('❌ Download invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Print invoice (returns HTML for printing)
router.get('/:invoiceId/print', protect, async (req, res) => {
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

    const order = invoice.orderId;
    
    // Calculate totals
    const lineTotals = order.lineItems?.map((item) => {
      const gross = item.quantity * item.unitPrice;
      const discountAmt = gross * (item.discount / 100);
      return { ...item, gross, discountAmt, total: gross - discountAmt };
    }) || [];

    const subtotal = lineTotals.reduce((sum, i) => sum + i.gross, 0);
    const totalDiscount = lineTotals.reduce((sum, i) => sum + i.discountAmt, 0);
    const taxable = subtotal - totalDiscount;
    const tax = taxable * (invoice.taxRate || 15) / 100;
    const totalDue = taxable + tax;

    // Render HTML for printing
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .invoice-meta { display: flex; justify-content: space-between; margin: 20px 0; }
          .bill-to { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #4F46E5; color: white; }
          .totals { text-align: right; margin-top: 20px; }
          .total { font-size: 18px; font-weight: bold; color: #4F46E5; }
          .bank-details { background: #f0f4ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>${invoice.invoiceNumber}</p>
        </div>
        
        <div class="invoice-meta">
          <div>
            <p><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Status:</strong> ${order.status || 'INVOICED'}</p>
          </div>
        </div>

        <div class="bill-to">
          <h3>Bill To</h3>
          <p><strong>${order.contactName || 'N/A'}</strong></p>
          <p>${order.companyName || 'N/A'}</p>
          <p>${order.contactEmail || 'N/A'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineTotals.map(item => `
              <tr>
                <td>${item.productName || 'N/A'}</td>
                <td>${item.quantity || 0}</td>
                <td>$${item.unitPrice?.toFixed(2) || '0.00'}</td>
                <td>${item.discount || 0}%</td>
                <td>$${item.total?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: $${subtotal.toFixed(2)}</p>
          <p>Discount: -$${totalDiscount.toFixed(2)}</p>
          <p>Tax (${invoice.taxRate || 15}%): $${tax.toFixed(2)}</p>
          <p class="total">Total Due: $${totalDue.toFixed(2)}</p>
        </div>

        <div class="bank-details">
          <h4>Payment Details</h4>
          <p><strong>Bank Transfer:</strong></p>
          <p>Account Name: ${invoice.bankDetails?.accountName || 'CRM Platform'}</p>
          <p>IBAN: ${invoice.bankDetails?.iban || 'XX00 0000 0000 0000 0000'}</p>
          <p>Reference: ${invoice.invoiceNumber}</p>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('❌ Print invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;