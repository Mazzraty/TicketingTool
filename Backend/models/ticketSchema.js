import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // =========================
    // MULTI TENANT
    // =========================
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

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
      index: true,
    },

    // =========================
    // STATUS
    // =========================
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },

    // =========================
    // ATTACHMENTS
    // =========================
    attachments: {
      type: [String],
      default: [],
    },

    // =========================
    // SLA
    // =========================
    sla: {
      // Policy used
      priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
      },

      // Response SLA
      firstResponseDue: {
        type: Date,
        default: null,
      },

      firstRespondedAt: {
        type: Date,
        default: null,
      },

      firstResponseBreached: {
        type: Boolean,
        default: false,
      },

      // Resolution SLA
      resolutionDue: {
        type: Date,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      resolutionBreached: {
        type: Boolean,
        default: false,
      },

      // Escalation
      escalationLevel: {
        type: Number,
        default: 0,
      },

      escalated: {
        type: Boolean,
        default: false,
      },

      escalatedAt: {
        type: Date,
        default: null,
      },

      // Overall SLA Status
      status: {
        type: String,
        enum: ["Running", "Completed", "Breached"],
        default: "Running",
      },
    },

    // =========================
    // REVIEW
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

    reviewedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // TIMESTAMPS
    // =========================
    inProgressAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    reopened: {
      type: Boolean,
      default: false,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // USER
    // =========================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =========================
    // STATUS HISTORY
    // =========================
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Open", "In Progress", "Resolved", "Closed"],
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        note: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketSchema.index({ companyId: 1, status: 1 });
ticketSchema.index({ companyId: 1, priority: 1 });
ticketSchema.index({ "sla.resolutionDue": 1 });
ticketSchema.index({ "sla.firstResponseDue": 1 });

export default mongoose.model("Ticket", ticketSchema);