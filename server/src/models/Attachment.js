const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
attachmentSchema.index({ entityType: 1, entityId: 1 });
attachmentSchema.index({ isDeleted: 1 });

// Add a virtual for URL
attachmentSchema.virtual('url').get(function() {
  return `/api/attachments/${this._id}/download`;
});

// Ensure virtuals are included in JSON
attachmentSchema.set('toJSON', { virtuals: true });
attachmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attachment', attachmentSchema);