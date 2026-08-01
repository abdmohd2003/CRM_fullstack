const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    
    // ============ NEW FIELDS ============
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Note", "Task", "Order", "Payment", "Invoice"],
      required: true,
    },

    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    
    description: { type: String, trim: true },
    activityDate: { type: Date, default: Date.now },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
  action: {
  type: String,
  enum: [
    'DEAL_STAGE_CHANGED',
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'ORDER_UPDATED',
    'ORDER_CANCELLED',
    'ORDER_COMPLETED',   
    'INVOICE_GENERATED',
    'INVOICE_EMAILED',
    'PAYMENT_RECORDED',
    'PAYMENT_AUTO_RECORDED',
    'PAYMENT_REFUNDED',
    'ORDER_PAID',
    'ORDER_PARTIAL',
  ],
},
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);