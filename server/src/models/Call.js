const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    connected: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    callOutcome: {
      type: String,
      required: true,
    },
    callDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    note: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Call", callSchema);