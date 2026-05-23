import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // BASIC INFO
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    department: { type: String, default: "General" },

    // PRIORITY
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    // STATUS
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },

    // ATTACHMENTS
    attachments: { type: [String], default: [] },

    // SLA
    slaDue: { type: Date },

    // REVIEW
    review: { type: String, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 0 },

    // TIMESTAMPS
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    reopened: { type: Boolean, default: false },
    reopenedAt: { type: Date, default: null },

    // USER
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ⭐ NEW: FULL TIMELINE TRACKING
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Open", "In Progress", "Resolved", "Closed"],
        },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Ticket", ticketSchema);