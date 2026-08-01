// scripts/fixOrderRounding.js
//
// One-time cleanup for orders created before the rounding fix, where
// totalAmount/balanceDue may have been saved with floating-point drift
// (e.g. 5404.994999999998 instead of 5405.00), causing a permanent
// phantom balanceDue like $0.01/$0.02 even after a "full" payment.
//
// Usage (run from the folder containing your .env, usually "server"):
//   node src/scripts/fixOrderRounding.js
//
// Requires a Mongo connection string in your environment — checks
// several common variable names since apps name this differently.

// Explicitly load .env — standalone scripts don't get this for free the
// way your main server entry file might (e.g. via require('dotenv').config()
// at the top of index.js/server.js). Path is relative to this file, so it
// finds server/.env regardless of which folder you run `node` from.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

function round2(n) {
  if (n === null || n === undefined) return n;
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  process.env.DB_URI;

async function run() {
  if (!MONGO_URI) {
    throw new Error(
      'No Mongo connection string found in environment. Checked MONGODB_URI, ' +
      'MONGO_URI, DATABASE_URL, DB_URI. Open your server/.env file, find the ' +
      'variable name your app actually uses to connect, and either rename it ' +
      'to one of these or add it to the list in this script.'
    );
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const orders = await Order.find({ status: { $ne: 'CANCELLED' } });
  console.log(`Checking ${orders.length} orders...`);

  let fixedCount = 0;

  for (const order of orders) {
    const payments = await Payment.find({
      orderId: order._id,
      status: 'COMPLETED',
    });

    const amountPaid = round2(
      payments.reduce((sum, p) => round2(sum + round2(p.amount)), 0)
    );
    const totalAmount = round2(order.totalAmount);
    const balanceDue = round2(Math.max(0, totalAmount - amountPaid));

    const before = {
      totalAmount: order.totalAmount,
      amountPaid: order.amountPaid,
      balanceDue: order.balanceDue,
      status: order.status,
    };

    let status = order.status;
    if (status !== 'CANCELLED') {
      if (balanceDue <= 0.005) {
        status = 'PAID';
        if (!order.paidAt) order.paidAt = new Date();
      } else if (amountPaid > 0) {
        status = 'PARTIAL';
      }
    }

    const changed =
      before.totalAmount !== totalAmount ||
      before.amountPaid !== amountPaid ||
      before.balanceDue !== balanceDue ||
      before.status !== status;

    if (changed) {
      order.totalAmount = totalAmount;
      order.amountPaid = amountPaid;
      order.balanceDue = balanceDue;
      order.status = status;
      await order.save(); // pre-save hook rounds line items too
      fixedCount++;
      console.log(
        `Fixed ${order.orderNumber}: total ${before.totalAmount} -> ${totalAmount}, ` +
        `paid ${before.amountPaid} -> ${amountPaid}, ` +
        `balance ${before.balanceDue} -> ${balanceDue}, ` +
        `status ${before.status} -> ${status}`
      );
    }
  }

  console.log(`Done. Fixed ${fixedCount} of ${orders.length} orders.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});