// models/Order.js
const mongoose = require('mongoose');

const orderLineItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'CONFIRMED', 'INVOICED', 'PARTIAL', 'PAID', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT',
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
 companyName: {
  type: String,
  required: true,
},
  contactName: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    required: true,
  },
  contactPhone: String,
  
  // Financial fields
  subtotal: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 15,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  balanceDue: {
    type: Number,
    default: 0,
  },
    completedAt: {
    type: Date,
    default: null,
    index: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
},
  // Invoice fields
  invoiceNumber: String,
  invoiceGeneratedAt: Date,
  
  // Timestamps
  confirmedAt: Date,
  paidAt: Date,
  paymentDueDate: Date,
  
  notes: String,
  lineItems: [orderLineItemSchema],
  
  // For progress tracking
  progressPercentage: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Virtual for progress
orderSchema.virtual('progress').get(function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.amountPaid / this.totalAmount) * 100);
});

// Method to update progress
orderSchema.methods.updateProgress = function() {
  this.progressPercentage = this.progress;
  return this;
};

// --- MONEY ROUNDING SAFETY NET ---
// Every money field on this schema is a plain JS Number, so any float
// arithmetic upstream (tax calc, payment summation, etc.) can persist a
// value like 5404.994999999998 to the DB even though the UI displays a
// clean "$5405.00". Once that imprecise value is saved, every downstream
// calculation (Stripe cents conversion, balanceDue, payment status) just
// propagates the error — no amount of rounding in the controllers can
// undo a bad value that's already in the database.
//
// This hook rounds every currency field to 2 decimal places right before
// save, regardless of which controller/helper wrote to the document. It's
// a last line of defense that doesn't depend on every code path
// remembering to round correctly.
function round2(n) {
  if (n === null || n === undefined) return n;
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

orderSchema.pre('save', function (next) {
  this.subtotal = round2(this.subtotal);
  this.taxAmount = round2(this.taxAmount);
  this.totalAmount = round2(this.totalAmount);
  this.amountPaid = round2(this.amountPaid);
  this.balanceDue = round2(this.balanceDue);

  if (Array.isArray(this.lineItems)) {
    this.lineItems.forEach((item) => {
      item.unitPrice = round2(item.unitPrice);
      item.lineTotal = round2(item.lineTotal);
    });
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);