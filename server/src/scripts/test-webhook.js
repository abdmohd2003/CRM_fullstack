// scripts/test-webhook.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/stripe`;

async function testPaymentSuccess(orderId = 'test_order_12345') {
  console.log('🔄 Testing Payment Success Webhook...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Create a mock payment intent
    const paymentIntent = {
      id: `pi_test_${Date.now()}`,
      amount: 10000, // $100.00
      currency: 'usd',
      metadata: {
        orderId: orderId
      },
      payment_method_types: ['card'],
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
    };

    // Webhook payload
    const payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: paymentIntent
      },
      _test: true // This bypasses signature verification
    };

    console.log(`📦 Order ID: ${orderId}`);
    console.log(`💰 Amount: $${paymentIntent.amount / 100}`);
    console.log('📡 Sending webhook...');

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      }
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running! Please start your server first.');
    } else {
      console.error(error.message);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

async function testPaymentFailure(orderId = 'test_order_12345') {
  console.log('🔄 Testing Payment Failure Webhook...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const paymentIntent = {
      id: `pi_test_${Date.now()}`,
      amount: 10000,
      currency: 'usd',
      metadata: {
        orderId: orderId
      },
      last_payment_error: {
        message: 'Card declined: insufficient funds'
      },
      status: 'failed',
      created: Math.floor(Date.now() / 1000),
    };

    const payload = {
      type: 'payment_intent.payment_failed',
      data: {
        object: paymentIntent
      },
      _test: true
    };

    console.log(`📦 Order ID: ${orderId}`);
    console.log(`💰 Amount: $${paymentIntent.amount / 100}`);
    console.log('📡 Sending webhook...');

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      }
    });

    console.log('✅ Payment failure webhook test successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

async function testRefund(orderId = 'test_order_12345') {
  console.log('🔄 Testing Refund Webhook...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const charge = {
      id: `ch_test_${Date.now()}`,
      amount: 10000,
      amount_refunded: 10000,
      currency: 'usd',
      payment_intent: `pi_test_${Date.now()}`,
      metadata: {
        orderId: orderId
      },
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
    };

    const payload = {
      type: 'charge.refunded',
      data: {
        object: charge
      },
      _test: true
    };

    console.log(`📦 Order ID: ${orderId}`);
    console.log(`💰 Refund Amount: $${charge.amount_refunded / 100}`);
    console.log('📡 Sending webhook...');

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      }
    });

    console.log('✅ Refund webhook test successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running on ' + BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ Server is not running!');
    console.log('Please start your server first: npm run dev');
    return false;
  }
}

// Main function
async function runTests() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        STRIPE WEBHOOK TEST SUITE                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  const isRunning = await checkServer();
  if (!isRunning) return;

  // Get order ID from command line or use default
  const orderId = process.argv[2] || 'test_order_12345';
  
  // Get test type from command line
  const testType = process.argv[3] || 'all';

  console.log(`📦 Using Order ID: ${orderId}`);
  console.log(`🧪 Test Type: ${testType}`);
  console.log('');

  if (testType === 'all' || testType === 'success') {
    await testPaymentSuccess(orderId);
  }
  
  if (testType === 'all' || testType === 'failure') {
    await testPaymentFailure(orderId);
  }
  
  if (testType === 'all' || testType === 'refund') {
    await testRefund(orderId);
  }

  console.log('✅ All tests completed!');
}

// Run the tests
runTests();