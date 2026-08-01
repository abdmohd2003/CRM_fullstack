// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  pdfUrl: String,
  paymentLink: String,
  isSent: {
    type: Boolean,
    default: false,
  },
  sentAt: Date,
  // Invoice details
  billTo: {
    name: String,
    company: String,
    email: String,
    phone: String,
  },
  bankDetails: {
    accountName: String,
    iban: String,
    routing: String,
    reference: String,
  },
  taxRate: {
    type: Number,
    default: 15,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);