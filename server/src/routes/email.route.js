const nodemailer = require("nodemailer");
const express    = require("express");
const router     = express.Router();
const mongoose = require("mongoose");

// Import Email model
const Email = require("../models/Email");
const Attachment = require("../models/Attachment");

// ── Email Schema ──
// Make sure this is in models/Email.model.js

// ── Configure Nodemailer Transporter ──
const createTransporter = () => {
  // For Gmail
  if (process.env.EMAIL_SERVICE === 'gmail' || !process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    });
  }
  
  // For other SMTP services
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ── Helper: Send email with attachments ──
const sendEmailWithAttachments = async (to, subject, body, attachments = []) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"CRM App" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: body.replace(/\n/g, '<br>'),
    attachments: []
  };

  // Process attachments if any
  if (attachments && attachments.length > 0) {
    console.log(`📎 Processing ${attachments.length} attachments...`);
    
    for (const att of attachments) {
      try {
        if (att.source === 'saved' && att.id) {
          // Get from database
          const savedAtt = await Attachment.findOne({
            _id: att.id,
            isDeleted: false
          });
          
          if (savedAtt && savedAtt.filePath) {
            // Check if file exists
            const fs = require('fs');
            if (fs.existsSync(savedAtt.filePath)) {
              mailOptions.attachments.push({
                filename: savedAtt.originalName || savedAtt.fileName,
                path: savedAtt.filePath
              });
              console.log(`✅ Added saved attachment: ${savedAtt.originalName}`);
            }
          }
        } else if (att.content) {
          // For uploaded files (base64 content)
          const fileExtension = att.name ? att.name.split('.').pop() : 'file';
          const contentType = att.type || 'application/octet-stream';
          
          mailOptions.attachments.push({
            filename: att.name || `attachment.${fileExtension}`,
            content: Buffer.from(att.content, 'base64'),
            contentType: contentType
          });
          console.log(`✅ Added uploaded attachment: ${att.name}`);
        } else if (att.url) {
          // For file URLs
          mailOptions.attachments.push({
            filename: att.name || 'file',
            path: att.url
          });
          console.log(`✅ Added URL attachment: ${att.name}`);
        }
      } catch (attError) {
        console.error(`❌ Error processing attachment:`, attError);
        // Continue with other attachments
      }
    }
  }

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  return info;
};

// ── Send email with attachments (supports both simple and attachment emails) ──
// In routes/email.route.js - add better error handling
router.post("/send-with-attachments", async (req, res) => {
  try {
    console.log('📧 Received email request:', {
      body: req.body,
      hasAttachments: !!req.body.attachments,
      attachmentCount: req.body.attachments?.length || 0
    });

    const { to, subject, body, attachments = [] } = req.body;

    // Validate required fields
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to) is required'
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject is required'
      });
    }

    if (!body) {
      return res.status(400).json({
        success: false,
        error: 'Email body is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientsList = to.split(',').map(email => email.trim());
    const invalidEmails = recipientsList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid email address(es): ${invalidEmails.join(', ')}`
      });
    }

    // Send email
    const info = await sendEmailWithAttachments(to, subject, body, attachments || []);

    // Save to database
    const email = new Email({
      subject,
      body,
      from: process.env.EMAIL_USER,
      to,
      status: "Sent",
      attachments: attachments.map(a => a.name).join(', '),
      attachmentCount: attachments.length
    });
    await email.save();

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: info.messageId,
        to,
        subject,
        attachmentsCount: attachments.length
      }
    });

  } catch (error) {
    console.error('❌ Send email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ── Simple email send (backward compatibility) ──
router.post("/send", async (req, res) => {
  try {
    console.log('📧 Sending simple email...');
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'To, subject, and body are required'
      });
    }

    // Send email without attachments
    const info = await sendEmailWithAttachments(to, subject, body, []);

    console.log('✅ Email sent:', info.messageId);

    // Save email to database
    try {
      const email = new Email({
        subject: subject,
        body: body,
        from: process.env.EMAIL_USER,
        to: to,
        status: "Sent"
      });
      await email.save();
    } catch (dbError) {
      console.error('Failed to save email to database:', dbError);
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: { messageId: info.messageId }
    });

  } catch (error) {
    console.error('❌ Send email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ── Get email history ──
router.get("/history", async (req, res) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      data: emails
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email history'
    });
  }
});

module.exports = router;