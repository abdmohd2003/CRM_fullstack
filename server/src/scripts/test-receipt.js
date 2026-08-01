// server/src/scripts/test-receipt.js
require('dotenv').config({ path: '../../.env' });
const emailService = require('../services/email.service');

async function testReceipt() {
  console.log('📧 Testing Payment Receipt Email...');
  console.log('─────────────────────────────────');
  
  try {
    const result = await emailService.sendPaymentReceipt(
      'ameennk1110@gmail.com', // Test email
      {
        amount: 5000,
        receiptNumber: 'RCPT-TEST-001',
        method: 'BANK_TRANSFER',
        paymentDate: new Date(),
        reference: 'TEST-001'
      },
      {
        orderNumber: 'ORD-TEST-001',
        contactName: 'Test Customer',
        balanceDue: 10000
      }
    );
    
    console.log('✅ Receipt sent successfully!');
    console.log('📧 Result:', result);
    
  } catch (error) {
    console.error('❌ Failed to send receipt:', error.message);
    console.error('Stack:', error.stack);
  }
}

testReceipt();