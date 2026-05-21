import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFO
    // =========================
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "General",
    },

    // =========================
    // PRIORITY
    // =========================
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    // =========================
    // STATUS
    // =========================
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },

    // =========================
    // ATTACHMENTS
    // =========================
    attachments: {
      type: [String],
      default: [],
    },

    // =========================
    // SLA (optional but useful)
    // =========================
    slaDue: {
      type: Date,
    },

    // =========================
    // USER FEEDBACK
    // =========================
    review: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // =========================
    // TIMESTAMPS (CUSTOM TRACKING)
    // =========================

    // when ticket is resolved
    resolvedAt: {
      type: Date,
      default: null,
    },

    // when ticket is fully closed
    closedAt: {
      type: Date,
      default: null,
    },

    // reopen tracking
    reopened: {
      type: Boolean,
      default: false,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // USER REFERENCE
    // =========================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt = OPEN time, updatedAt = last change
  }
);

export default mongoose.model("Ticket", ticketSchema);