// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'ORDER_CREATED',
      'ORDER_CONFIRMED',
      'ORDER_COMPLETED',   // ✅ added — fixes "Notification validation failed" on Mark as Completed
      'INVOICE_READY',
      'PAYMENT_RECEIVED',
      'ORDER_PAID',
      'DEAL_STAGE_CHANGED',
      'SYSTEM_ALERT',
      'PAYMENT_FAILED',
      'PAYMENT_REFUNDED'
    ],
    required: true,
    index: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  link: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);