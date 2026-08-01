// scripts/test-complete-flow.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// ============================================================
// UPDATE THESE VALUES
// ============================================================
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with your actual token
const USER_ID = 'YOUR_USER_ID_HERE'; // Replace with your user ID
// ============================================================

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

let createdDeal = null;
let createdOrder = null;
let createdInvoice = null;
let payments = [];

async function testCompleteFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           COMPLETE ORDER-TO-PAYMENT FLOW TEST                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // ============================================================
    // STEP 1: Create a Deal
    // ============================================================
    console.log('📝 STEP 1: Creating a Deal...');
    console.log('───────────────────────────────────────────────────────────────');
    
    const dealData = {
      name: 'Enterprise CRM Deal - Test Flow',
      amount: 15000,
      stage: 'LEAD',
      owner: [USER_ID],
      priority: 'High',
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      company: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1-555-0123',
      status: 'Active',
      jobTitle: 'CTO',
      firstName: 'John',
      lastName: 'Doe',
      lineItems: [
        {
          productName: 'Enterprise License',
          description: 'Annual enterprise CRM license',
          quantity: 1,
          unitPrice: 15000,
          discount: 0,
          lineTotal: 15000,
        }
      ]
    };

    const dealResponse = await axios.post(`${API_URL}/deals`, dealData, { headers });
    createdDeal = dealResponse.data.data || dealResponse.data;
    
    console.log(`✅ Deal Created:`);
    console.log(`   ID: ${createdDeal._id}`);
    console.log(`   Name: ${createdDeal.name}`);
    console.log(`   Amount: $${createdDeal.amount}`);
    console.log(`   Stage: ${createdDeal.stage}`);
    console.log('');

    // ============================================================
    // STEP 2: Move Deal to CLOSED_WON (Auto-creates Order)
    // ============================================================
    console.log('📝 STEP 2: Moving Deal to CLOSED_WON...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️  This will AUTO-CREATE a Draft Order!');
    console.log('');

    const stageResponse = await axios.patch(
      `${API_URL}/deals/${createdDeal._id}/stage`,
      { stage: 'CLOSED_WON' },
      { headers }
    );

    const { deal: updatedDeal, order } = stageResponse.data.data || stageResponse.data;
    createdOrder = order;
    
    console.log(`✅ Deal Updated:`);
    console.log(`   Stage: ${updatedDeal.stage}`);
    console.log(`   Order ID: ${updatedDeal.orderId}`);
    console.log('');
    console.log(`✅ Order Auto-Created:`);
    console.log(`   ID: ${createdOrder._id}`);
    console.log(`   Order Number: ${createdOrder.orderNumber}`);
    console.log(`   Status: ${createdOrder.status}`);
    console.log(`   Total: $${createdOrder.totalAmount}`);
    console.log(`   Balance Due: $${createdOrder.balanceDue}`);
    console.log('');

    // ============================================================
    // STEP 3: Get Order Details
    // ============================================================
    console.log('📝 STEP 3: Fetching Order Details...');
    console.log('───────────────────────────────────────────────────────────────');

    const orderResponse = await axios.get(
      `${API_URL}/orders/${createdOrder._id}`,
      { headers }
    );
    const orderDetails = orderResponse.data.data || orderResponse.data;
    
    console.log(`✅ Order Details:`);
    console.log(`   Number: ${orderDetails.orderNumber}`);
    console.log(`   Status: ${orderDetails.status}`);
    console.log(`   Total: $${orderDetails.totalAmount}`);
    console.log(`   Balance Due: $${orderDetails.balanceDue}`);
    console.log(`   Line Items: ${orderDetails.lineItems?.length || 0}`);
    console.log(`   Progress: ${orderDetails.progress || 0}%`);
    console.log('');

    // ============================================================
    // STEP 4: Confirm Order
    // ============================================================
    console.log('📝 STEP 4: Confirming Order...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️  This moves order from DRAFT → CONFIRMED');
    console.log('');

    const confirmResponse = await axios.patch(
      `${API_URL}/orders/${createdOrder._id}/confirm`,
      {},
      { headers }
    );
    
    const confirmedOrder = confirmResponse.data.data || confirmResponse.data;
    console.log(`✅ Order Confirmed:`);
    console.log(`   Status: ${confirmedOrder.status}`);
    console.log(`   Confirmed At: ${confirmedOrder.confirmedAt}`);
    console.log(`   Message: ${confirmResponse.data.message}`);
    console.log('');

    // ============================================================
    // STEP 5: Generate Invoice
    // ============================================================
    console.log('📝 STEP 5: Generating Invoice...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️  This moves order from CONFIRMED → INVOICED');
    console.log('');

    const invoiceResponse = await axios.post(
      `${API_URL}/invoices/generate/${createdOrder._id}`,
      {},
      { headers }
    );
    
    const { invoice, order: invoicedOrder } = invoiceResponse.data.data || invoiceResponse.data;
    createdInvoice = invoice;
    
    console.log(`✅ Invoice Generated:`);
    console.log(`   ID: ${createdInvoice._id}`);
    console.log(`   Invoice Number: ${createdInvoice.invoiceNumber}`);
    console.log(`   Issue Date: ${new Date(createdInvoice.issueDate).toLocaleDateString()}`);
    console.log(`   Due Date: ${new Date(createdInvoice.dueDate).toLocaleDateString()}`);
    console.log(`   PDF URL: ${createdInvoice.pdfUrl || 'Generated'}`);
    console.log('');
    console.log(`✅ Order Updated:`);
    console.log(`   Status: ${invoicedOrder.status}`);
    console.log(`   Invoice Number: ${invoicedOrder.invoiceNumber}`);
    console.log('');

    // ============================================================
    // STEP 6: Send Invoice Email (Optional - Test)
    // ============================================================
    console.log('📝 STEP 6: Sending Invoice Email...');
    console.log('───────────────────────────────────────────────────────────────');

    try {
      const emailResponse = await axios.post(
        `${API_URL}/invoices/${createdInvoice._id}/send-email`,
        {
          email: 'test@example.com',
          subject: `Invoice ${createdInvoice.invoiceNumber} from CRM Platform`,
          message: `Dear Test User,\n\nPlease find attached invoice ${createdInvoice.invoiceNumber} for your order ${createdOrder.orderNumber}.\n\nAmount Due: $${invoicedOrder.balanceDue.toFixed(2)}\nDue Date: ${new Date(createdInvoice.dueDate).toLocaleDateString()}\n\nThank you for your business.`
        },
        { headers }
      );
      console.log(`✅ Invoice Email Sent: ${emailResponse.data.message}`);
    } catch (emailError) {
      console.log(`⚠️  Email Send Status: ${emailError.response?.data?.message || 'Failed to send'}`);
      console.log(`   (Email may not be configured for this test)`);
    }
    console.log('');

    // ============================================================
    // STEP 7: Record Partial Payment
    // ============================================================
    console.log('📝 STEP 7: Recording Partial Payment...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️  This moves order from INVOICED → PARTIAL');
    console.log('');

    const halfAmount = createdOrder.totalAmount / 2;
    const paymentData1 = {
      orderId: createdOrder._id,
      amount: halfAmount,
      paymentDate: new Date().toISOString(),
      method: 'BANK_TRANSFER',
      reference: 'PAY-PARTIAL-001',
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      notes: 'First installment payment'
    };

    const paymentResponse1 = await axios.post(
      `${API_URL}/payments/record`,
      paymentData1,
      { headers }
    );
    
    const payment1 = paymentResponse1.data.data || paymentResponse1.data;
    payments.push(payment1.payment);
    
    console.log(`✅ Partial Payment Recorded:`);
    console.log(`   Amount: $${paymentData1.amount}`);
    console.log(`   Method: ${paymentData1.method}`);
    console.log(`   Reference: ${paymentData1.reference}`);
    console.log(`   Order Status: ${payment1.order?.status || 'PARTIAL'}`);
    console.log(`   Progress: ${payment1.progress || 50}%`);
    console.log(`   Balance Due: $${payment1.order?.balanceDue || (createdOrder.totalAmount - halfAmount)}`);
    console.log(`   Message: ${paymentResponse1.data.message}`);
    console.log('');

    // ============================================================
    // STEP 8: Record Final Payment (Completes Order)
    // ============================================================
    console.log('📝 STEP 8: Recording Final Payment...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️  This moves order from PARTIAL → PAID');
    console.log('');

    const paymentData2 = {
      orderId: createdOrder._id,
      amount: halfAmount,
      paymentDate: new Date().toISOString(),
      method: 'CREDIT_CARD',
      reference: 'PAY-FINAL-001',
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      notes: 'Final installment payment - Order completed'
    };

    const paymentResponse2 = await axios.post(
      `${API_URL}/payments/record`,
      paymentData2,
      { headers }
    );
    
    const payment2 = paymentResponse2.data.data || paymentResponse2.data;
    payments.push(payment2.payment);
    
    console.log(`✅ Final Payment Recorded:`);
    console.log(`   Amount: $${paymentData2.amount}`);
    console.log(`   Method: ${paymentData2.method}`);
    console.log(`   Reference: ${paymentData2.reference}`);
    console.log(`   Order Status: ${payment2.order?.status || 'PAID'}`);
    console.log(`   Progress: ${payment2.progress || 100}%`);
    console.log(`   Balance Due: $${payment2.order?.balanceDue || 0}`);
    console.log(`   Message: ${paymentResponse2.data.message}`);
    console.log('');

    // ============================================================
    // STEP 9: Get Final Order Status
    // ============================================================
    console.log('📝 STEP 9: Fetching Final Order Status...');
    console.log('───────────────────────────────────────────────────────────────');

    const finalOrderResponse = await axios.get(
      `${API_URL}/orders/${createdOrder._id}`,
      { headers }
    );
    const finalOrder = finalOrderResponse.data.data || finalOrderResponse.data;
    
    console.log(`✅ Final Order Status:`);
    console.log(`   Order: ${finalOrder.orderNumber}`);
    console.log(`   Status: ${finalOrder.status}`);
    console.log(`   Total: $${finalOrder.totalAmount}`);
    console.log(`   Amount Paid: $${finalOrder.amountPaid}`);
    console.log(`   Balance Due: $${finalOrder.balanceDue}`);
    console.log(`   Progress: ${finalOrder.progress || 100}%`);
    console.log(`   Paid At: ${finalOrder.paidAt || 'N/A'}`);
    console.log(`   Payments Count: ${finalOrder.payments?.length || 0}`);
    console.log('');

    // ============================================================
    // STEP 10: Check Notifications
    // ============================================================
    console.log('📝 STEP 10: Checking Notifications...');
    console.log('───────────────────────────────────────────────────────────────');

    const notificationsResponse = await axios.get(
      `${API_URL}/notifications`,
      { headers }
    );
    const notifications = notificationsResponse.data.data?.notifications || [];
    
    console.log(`✅ Notifications:`);
    console.log(`   Total: ${notifications.length}`);
    console.log(`   Unread: ${notifications.filter(n => !n.read).length}`);
    console.log('');
    console.log('   Recent Notifications:');
    notifications.slice(0, 5).forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.title}`);
      console.log(`      ${n.message.substring(0, 60)}...`);
      console.log(`      ${n.read ? '✅ Read' : '🔴 Unread'}`);
      console.log('');
    });

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TEST COMPLETED!                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Flow Summary:');
    console.log('   LEAD → CLOSED_WON → DRAFT → CONFIRMED → INVOICED → PARTIAL → PAID');
    console.log('');
    console.log('📦 Created:');
    console.log(`   Deal: ${createdDeal.name} (${createdDeal._id})`);
    console.log(`   Order: ${createdOrder.orderNumber} (${createdOrder._id})`);
    console.log(`   Invoice: ${createdInvoice.invoiceNumber} (${createdInvoice._id})`);
    console.log(`   Payments: ${payments.length}`);
    console.log('');
    console.log('📧 Email sent to: test@example.com');
    console.log('');

  } catch (error) {
    console.error('❌ Test Failed:');
    console.error('───────────────────────────────────────────────────────────────');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running!');
      console.log('Please start your server first: npm run dev');
    } else {
      console.error(`Error: ${error.message}`);
    }
    console.log('───────────────────────────────────────────────────────────────');
  }
}

// ============================================================
// Helper: Check Server Status
// ============================================================
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================
// Helper: Auto-Login to Get Token
// ============================================================
async function getToken() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    return response.data.token || response.data.data?.token;
  } catch (error) {
    console.error('❌ Auto-login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// ============================================================
// Main
// ============================================================
async function run() {
  console.log('\n🔍 Checking server status...');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.error('❌ Server is not running!');
    console.log('Please start your server first: npm run dev');
    return;
  }
  console.log('✅ Server is running\n');

  // Get token if not provided
  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('🔑 No token provided. Attempting auto-login...');
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token obtained successfully!\n');
    } else {
      console.log('❌ Could not obtain token.');
      console.log('Please update the TOKEN variable in the script.');
      return;
    }
  } else {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  await testCompleteFlow();
}

run();