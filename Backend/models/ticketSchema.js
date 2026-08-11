import mongoose from "mongoose";
const ticketSchema = new mongoose.Schema(
  {


    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
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
    // RELATED TO
    // =========================
    relatedTo: {
      type: String,
      enum: [
        "Laptop/Desktop",
        "ERP",
        "Email",
        "HHT",
        "HHT Printer",
        "Syncwise",
        "Printer",
        "Network",
        "Software",
        "Hardware",
        "Others",
      ],
      default: "Others",
      index: true,
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
    // ASSIGNMENT
    // =========================
    assignedRole: {
      type: String,
      enum: ["it_support", "super_admin"],
      default: "it_support",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // TICKET ESCALATION
    // =========================
    escalation: {
      isEscalated: {
        type: Boolean,
        default: false,
      },

      level: {
        type: Number,
        default: 0,
      },

      reason: {
        type: String,
        default: "",
      },

      escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      escalatedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      escalatedAt: {
        type: Date,
        default: null,
      },
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

      // Response breach reason (why the first-response SLA was missed)
      firstResponseBreachReason: {
        type: String,
        default: "",
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

      // Resolution breach reason (why the resolution SLA was missed)
      breachReason: {
        type: String,
        default: "",
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

    // Was missing from the schema entirely. The frontend has been
    // sending this field on Resolve/Close (payload.resolutionNote), but
    // Mongoose silently dropped it on save since it wasn't a defined
    // field on the schema — so it never actually persisted to the DB.
    resolutionNote: {
      type: String,
      default: "",
    },

    // =========================
    // RESOLUTION TYPE (Internal / External Vendor)
    // =========================
    resolutionType: {
      type: String,
      enum: ["Internal", "External Vendor"],
      default: "Internal",
    },

    // Populated only when resolutionType === "External Vendor".
    // Kept as a sub-document so it's easy to render as a single block
    // in the ticket detail/history view.
    vendorDetails: {
      vendorName: {
        type: String,
        default: "",
      },
      complaintDescription: {
        type: String,
        default: "",
      },
      repairDate: {
        type: Date,
        default: null,
      },
      cost: {
        type: Number,
        default: null,
      },
      receiptUrl: {
        type: String,
        default: "",
      },
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

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeMaster",
      default: null,
      index: true,
    },
    // =========================
    // INCIDENT DATE
    // =========================

    incidentDate: {
      type: Date,
      default: Date.now,
    },
    // =========================
    // TICKET SOURCE
    // =========================
    source: {
      type: String,
      enum: [
        "Portal",
        "Manual",
        "Email",
        "Phone"
      ],
      default: "Portal",
    },

    createdByType: {
      type: String,
      enum: [
        "user",
        "it_support",
        "company_admin",
        "super_admin"
      ],
      default: "user",
    },
    // ===

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      default: null,
      index: true,
    },
    // ======================
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
ticketSchema.index({ companyId: 1, relatedTo: 1 });
ticketSchema.index({ "sla.resolutionDue": 1 });
ticketSchema.index({ "sla.firstResponseDue": 1 });

export default mongoose.model("Ticket", ticketSchema);