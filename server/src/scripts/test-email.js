// scripts/test-gmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('📧 Testing Gmail SMTP...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`SMTP User: ${process.env.SMTP_USER}`);
  console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
  console.log('');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log('');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"CRM Test" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'ameennk1110@gmail.com',
      subject: '✅ CRM Email Test Successful',
      html: `
        <h1>Email Configuration Test</h1>
        <p>Your CRM email is working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p>SMTP: Gmail</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error(`Error: ${error.message}`);
    if (error.message.includes('Invalid login')) {
      console.log('');
      console.log('🔑 App Password Issues? Try these steps:');
      console.log('1. Go to https://myaccount.google.com/apppasswords');
      console.log('2. Generate a NEW app password');
      console.log('3. Copy the password WITHOUT spaces');
      console.log('4. Update your .env file');
      console.log('');
      console.log('Make sure 2-Step Verification is ENABLED on your Google account.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testGmail();