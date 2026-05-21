import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    title: String,

    description: String,

    department: String,

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Open",
    },

    attachments: [String],

    slaDue: Date,

    // ✅ review from user
    review: {
      type: String,
      default: "",
    },

    // ✅ rating
    rating: {
      type: Number,
      default: 0,
    },

    // ✅ solved/resolved time
    resolvedAt: {
      type: Date,
    },

    // ✅ reopened info
    reopened: {
      type: Boolean,
      default: false,
    },

    reopenedAt: {
      type: Date,
    },

    // ✅ IMPORTANT
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);