const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      required: true,
    },
    associatedLead: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
  }
],
    amount: {
      type: Number,
      required: true,
    },
    owner: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    closeDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    // ============ NEW FIELD ============
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deal", dealSchema);