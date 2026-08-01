const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    cc: {
      type: String,
    },
    bcc: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Sent", "Draft", "Failed"],
      default: "Sent",
    },
    attachments: {
      type: String, // Store attachment names as comma-separated string
    },
    attachmentCount: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // For tracking replies
    threadId: {
      type: String,
    },
    // For tracking email opens
    opened: {
      type: Boolean,
      default: false,
    },
    openedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Add index for faster queries
emailSchema.index({ to: 1, createdAt: -1 });
emailSchema.index({ status: 1 });

module.exports = mongoose.model("Email", emailSchema);