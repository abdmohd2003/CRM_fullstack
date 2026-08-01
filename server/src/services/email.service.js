// src/services/email.service.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if we have SMTP credentials
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('📧 Configuring SMTP with:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        });

        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Verify connection
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('❌ SMTP connection failed:', error.message);
          } else {
            console.log('✅ SMTP server is ready to send emails');
          }
        });

        console.log('✅ SMTP configured successfully');
      } else {
        console.log('⚠️ No SMTP credentials found. Email will be logged only.');
        this.transporter = null;
      }
    } catch (error) {
      console.error('❌ SMTP setup error:', error.message);
      this.transporter = null;
    }
  }

  // ============ CORE EMAIL SENDING ============
  async sendEmail(mailOptions) {
    // If no transporter, just log the email
    if (!this.transporter) {
      console.log('📧 [MOCK] Email would be sent:');
      console.log(`   To: ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log(`   Body: ${mailOptions.html ? mailOptions.html.substring(0, 100) + '...' : 'No HTML body'}`);
      return { messageId: 'mock-' + Date.now(), mock: true };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${mailOptions.to} — MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      // Fallback to mock
      console.log('📧 [MOCK] Email would be sent (fallback):');
      console.log(`   To: ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      return { messageId: 'mock-' + Date.now(), mock: true };
    }
  }

  // ============ PDF GENERATION ============
  async generateInvoicePDF(invoiceId) {
    try {
      console.log('📄 Generating PDF for invoice:', invoiceId);
      
      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.findById(invoiceId).populate('orderId');
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const order = invoice.orderId;
      
      // Create PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      const uploadDir = path.join(__dirname, '../uploads/invoices');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50, { align: 'center' });
      doc.fontSize(10).font('Helvetica')
         .text(`Invoice #: ${invoice.invoiceNumber}`, 50, 80)
         .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 95)
         .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 110)
         .text(`Order #: ${order.orderNumber}`, 50, 125);

      // Bill To
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 160);
      doc.fontSize(10).font('Helvetica')
         .text(order.contactName || 'N/A', 50, 175)
         .text(order.companyName || 'N/A', 50, 190)
         .text(order.contactEmail || 'N/A', 50, 205);

      // Line Items Table
      let y = 250;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Item', 50, y)
         .text('Qty', 250, y)
         .text('Price', 350, y)
         .text('Discount', 400, y)
         .text('Total', 450, y);

      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.fontSize(10).font('Helvetica');
      const lineItems = order.lineItems || [];
      lineItems.forEach((item) => {
        doc.text(item.productName || 'N/A', 50, y)
           .text(item.quantity?.toString() || '0', 250, y)
           .text(`$${item.unitPrice?.toFixed(2) || '0.00'}`, 350, y)
           .text(`${item.discount || 0}%`, 400, y)
           .text(`$${item.lineTotal?.toFixed(2) || '0.00'}`, 450, y);
        y += 20;
      });

      y += 20;
      doc.moveTo(350, y).lineTo(550, y).stroke();
      y += 10;

      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y).text(`$${order.subtotal?.toFixed(2) || '0.00'}`, 450, y);
      y += 20;
      doc.text(`Tax (${order.taxRate || 0}%):`, 350, y).text(`$${order.taxAmount?.toFixed(2) || '0.00'}`, 450, y);
      y += 20;
      doc.fontSize(12).text('Total:', 350, y).text(`$${order.totalAmount?.toFixed(2) || '0.00'}`, 450, y);

      // Payment Details
      const paymentTop = y + 40;
      doc.fontSize(10).font('Helvetica-Bold').text('Payment Details:', 50, paymentTop);
      doc.font('Helvetica').fontSize(9)
         .text('Bank Transfer:', 50, paymentTop + 20)
         .text(`Account Name: ${invoice.bankDetails?.accountName || 'CRM Platform'}`, 70, paymentTop + 35)
         .text(`IBAN: ${invoice.bankDetails?.iban || 'XX00 0000 0000 0000 0000'}`, 70, paymentTop + 50)
         .text(`Reference: ${invoice.invoiceNumber}`, 70, paymentTop + 65);

      doc.fontSize(8).text('Thank you for your business!', 50, 750, { align: 'center' });
      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log('✅ PDF generated:', filename);
          resolve(`/uploads/invoices/${filename}`);
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Generate PDF error:', error);
      throw error;
    }
  }

  // ============ SEND INVOICE EMAIL ============
  async sendInvoiceEmail({ to, subject, body, invoice, order }) {
    console.log(`📧 Sending invoice email to: ${to}`);
    
    let attachments = [];
    if (invoice.pdfUrl) {
      try {
        const fullPath = path.join(__dirname, '..', invoice.pdfUrl);
        if (fs.existsSync(fullPath)) {
          const pdfBuffer = fs.readFileSync(fullPath);
          attachments.push({
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
          console.log('📎 PDF attached:', invoice.pdfUrl);
        }
      } catch (error) {
        console.error('Error attaching PDF:', error);
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .total { font-size: 18px; font-weight: bold; color: #4F46E5; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Invoice ${invoice.invoiceNumber}</h1>
          </div>
          <div class="content">
            <p>${body.replace(/\n/g, '<br>')}</p>
            
            <div class="invoice-details">
              <h3>Invoice Summary</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> <span class="total">$${order.totalAmount?.toFixed(2) || '0.00'}</span></p>
            </div>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.BASE_URL || 'http://localhost:5000'}/invoices/${invoice._id}" class="button">View Invoice</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"CRM Billing" <${process.env.SMTP_FROM_EMAIL || 'billing@crm.com'}>`,
      to,
      subject: subject || `Invoice ${invoice.invoiceNumber} from CRM Platform`,
      html,
      attachments,
    };

    return this.sendEmail(mailOptions);
  }

  // ============ OTHER EMAIL METHODS ============
  async sendPasswordResetOTP(email, otp, userName) {
    const mailOptions = {
      from: `"CRM Support" <${process.env.SMTP_FROM_EMAIL || 'noreply@crm.com'}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset OTP</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
          <p>Valid for 10 minutes.</p>
        </div>
      `
    };
    return this.sendEmail(mailOptions);
  }

  async sendOrderConfirmationEmail(to, order) {
    const mailOptions = {
      from: `"CRM Platform" <${process.env.SMTP_FROM_EMAIL || 'noreply@crm.com'}>`,
      to,
      subject: `Order ${order.orderNumber} Confirmed`,
      html: `
        <h1>✅ Order Confirmed</h1>
        <p>Dear ${order.contactName || 'Customer'},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
        <p><strong>Total:</strong> $${order.totalAmount?.toFixed(2) || '0.00'}</p>
        <p>Thank you for your business!</p>
      `
    };
    return this.sendEmail(mailOptions);
  }

  async sendPaymentReceipt(to, payment, order) {
    const mailOptions = {
      from: `"CRM Payments" <${process.env.SMTP_FROM_EMAIL || 'payments@crm.com'}>`,
      to,
      subject: `Payment Receipt for Order ${order.orderNumber}`,
      html: `
        <h1>💰 Payment Receipt</h1>
        <p>Dear ${order.contactName || 'Customer'},</p>
        <p>Thank you for your payment of <strong>$${payment.amount?.toFixed(2) || '0.00'}</strong>.</p>
        <p><strong>Receipt Number:</strong> ${payment.receiptNumber || 'N/A'}</p>
        <p><strong>Order:</strong> ${order.orderNumber}</p>
        ${order.balanceDue > 0 ? `<p><strong>Remaining Balance:</strong> $${order.balanceDue.toFixed(2)}</p>` : '<p>✅ Order is fully paid!</p>'}
      `
    };
    return this.sendEmail(mailOptions);
  }

  async triggerERPWebhook(orderId, event) {
    console.log(`📡 ERP Webhook triggered for order ${orderId}, event: ${event}`);
    return { success: true };
  }

  async sendNotificationEmail(to, subject, message, type = 'notification') {
    const mailOptions = {
      from: `"CRM Platform" <${process.env.SMTP_FROM_EMAIL || 'noreply@crm.com'}>`,
      to,
      subject,
      html: `
        <h1>${type === 'alert' ? '⚠️ Alert' : '📬 Notification'}</h1>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };
    return this.sendEmail(mailOptions);
  }
}

module.exports = new EmailService();