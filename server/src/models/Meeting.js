const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    meetingType: {
      type: String,
      enum: [
        "Discovery Call",
        "Demo",
        "Follow Up",
        "Negotiation",
        "Other",
      ],
      default: "Other",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    location: {
      type: String,
      default: "",
    },

    meetingLink: {
      type: String,
      default: "",
    },

    reminder: {
      type: String,
      enum: [
        "5 mins",
        "15 mins",
        "30 mins",
        "1 hour",
        "15 minutes before",
        "30 minutes before",
        "1 hour before",
      ],
      default: "15 mins",
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "Completed",
        "Cancelled",
      ],
      default: "Scheduled",
    },

    note: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meeting", meetingSchema);