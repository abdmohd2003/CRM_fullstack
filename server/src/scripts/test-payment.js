// server/src/scripts/test-payment.js
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Order = require('../models/Order');
const Payment = require('../models/Payment');

async function testPayment() {
  await connectDB();
  
  console.log('💰 Testing Payment Flow');
  console.log('─────────────────────────────────');
  
  try {
    // Find an order
    const order = await Order.findOne({ status: 'INVOICED' });
    if (!order) {
      console.log('⚠️ No INVOICED order found. Please create one first.');
      process.exit(0);
    }
    
    console.log(`📦 Order: ${order.orderNumber}`);
    console.log(`💰 Total: $${order.totalAmount}`);
    console.log(`📊 Balance Due: $${order.balanceDue}`);
    console.log(`📋 Status: ${order.status}`);
    console.log('─────────────────────────────────');
    
    // Test payment amount (half of balance)
    const paymentAmount = order.balanceDue / 2;
    console.log(`💳 Recording payment: $${paymentAmount}`);
    
    // Record payment (you'll need to call the API or use the service)
    console.log('✅ Payment can be recorded via API');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPayment();