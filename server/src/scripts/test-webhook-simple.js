// scripts/test-webhook-simple.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/stripe`;

async function testWebhook() {
  console.log('🧪 Testing Stripe Webhook...\n');

  // Create a mock payment intent
  const paymentIntent = {
    id: `pi_test_${Date.now()}`,
    amount: 10000, // $100.00
    currency: 'usd',
    metadata: {
      orderId: 'test_order_12345'
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
    _test: true // This tells the server it's a test
  };

  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n📡 Sending to:', WEBHOOK_URL);

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      }
    });

    console.log('\n✅ Webhook test successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ Webhook test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running!');
      console.log('Please start your server first: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running!');
    console.log('Please start your server first: npm run dev');
    return false;
  }
}

// Run the test
async function run() {
  const isRunning = await checkServer();
  if (isRunning) {
    await testWebhook();
  }
}

run();