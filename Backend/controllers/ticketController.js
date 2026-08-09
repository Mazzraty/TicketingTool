import Ticket from "../models/ticketSchema.js";
import Company from "../models/comapnySchema.js";
import User from "../models/userShema.js";
import sendEmail from "../utils/sendEmail.js";
import { ticketAdminEmail } from "../utils/ticketAdminEmail.js";
import { ticketUserEmail } from "../utils/ticketUserEmail.js";
import { ticketResolvedEmail } from "../utils/ticketResolvedEmail.js";
import Notification from "../models/notifcationSchema.js";
import { generateTicketNumber } from "../utils/generateTicketNumber.js";

/* ======================================================
   ✅ CREATE TICKET
====================================================== */
export const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      relatedTo,
      priority,
    } = req.body;

    // ==================================================
    // COMPANY ID
    // ==================================================

    const companyId =
      req.user.companyId ||
      req.user.companyAccess?.find(
        (c) => c.isActive && c.companyId
      )?.companyId ||
      req.user.companyAccess?.[0]?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is not assigned to this user",
      });
    }

    // ==================================================
    // FIND COMPANY
    // ==================================================

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // ==================================================
    // COMPANY CODE
    // ==================================================

    const companyCode =
      company.code ||
      company.companyCode ||
      company.name
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase();

    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code is missing",
      });
    }

    // ==================================================
    // GENERATE COMPANY-WISE TICKET NUMBER
    // ==================================================

    const ticketNumber =
      await generateTicketNumber(
        companyId,
        companyCode
      );

    // ==================================================
    // SLA POLICY
    // ==================================================

    const slaPolicy = {
      Low: {
        firstResponse: 8,
        resolution: 72,
      },

      Medium: {
        firstResponse: 4,
        resolution: 48,
      },

      High: {
        firstResponse: 2,
        resolution: 24,
      },

      Critical: {
        firstResponse: 0.5,
        resolution: 8,
      },
    };

    const policy =
      slaPolicy[priority] ||
      slaPolicy.Low;

    // ==================================================
    // ATTACHMENTS
    // ==================================================

    const attachments = (
      req.files || []
    ).map((file) => file.path);

    // ==================================================
    // CREATE TICKET
    // ==================================================

    const ticket = await Ticket.create({
      // ==========================
      // TICKET NUMBER
      // ==========================

      ticketNumber,

      // ==========================
      // COMPANY
      // ==========================

      companyId,

      // ==========================
      // BASIC INFORMATION
      // ==========================

      title,

      description,

      department,

      relatedTo:
        relatedTo || "Others",

      priority,

      attachments,

      // ==========================
      // USER
      // ==========================

      userId: req.user.id,

      // ==========================
      // STATUS
      // ==========================

      status: "Open",

      // ==========================
      // ASSIGNMENT
      // ==========================

      assignedRole: "it_support",

      assignedTo: null,

      // ==========================
      // ESCALATION
      // ==========================

      escalation: {
        isEscalated: false,

        level: 0,

        reason: "",

        escalatedBy: null,

        escalatedTo: null,

        escalatedAt: null,
      },

      // ==========================
      // SLA
      // ==========================

      sla: {
        priority,

        firstResponseDue: new Date(
          Date.now() +
          policy.firstResponse *
          60 *
          60 *
          1000
        ),

        resolutionDue: new Date(
          Date.now() +
          policy.resolution *
          60 *
          60 *
          1000
        ),

        firstRespondedAt: null,

        resolvedAt: null,

        firstResponseBreached: false,

        resolutionBreached: false,

        escalationLevel: 0,

        escalated: false,

        escalatedAt: null,

        status: "Running",
      },

      // ==========================
      // REVIEW
      // ==========================

      review: "",

      rating: 0,

      reviewedAt: null,

      // ==========================
      // TIMESTAMPS
      // ==========================

      inProgressAt: null,

      resolvedAt: null,

      closedAt: null,

      reopened: false,

      reopenedAt: null,

      // ==========================
      // INCIDENT DATE
      // ==========================

      incidentDate: new Date(),

      // ==========================
      // SOURCE
      // ==========================

      source: "Portal",

      createdByType:
        req.user.role || "user",

      // ==========================
      // STATUS HISTORY
      // ==========================

      statusHistory: [
        {
          status: "Open",

          changedAt: new Date(),

          changedBy: req.user.id,

          note: "Ticket created",
        },
      ],
    });

    // ==================================================
    // FIND COMPANY USERS
    // ==================================================

    const companyUsers =
      await User.find({
        companyId,

        role: {
          $in: [
            "company_admin",
            "it_support",
          ],
        },
      });

    // ==================================================
    // FIND SUPER ADMINS
    // ==================================================

    const superAdmins =
      await User.find({
        role: "super_admin",
      });

    // ==================================================
    // REMOVE DUPLICATE USERS
    // ==================================================

    const uniqueUsers = new Map();

    [
      ...companyUsers,
      ...superAdmins,
    ].forEach((user) => {
      uniqueUsers.set(
        user._id.toString(),
        user
      );
    });

    // ==================================================
    // CREATE NOTIFICATIONS
    // ==================================================

    const notifications = [
      ...uniqueUsers.values(),
    ].map((user) => ({
      userId: user._id,

      title: "New Ticket",

      message:
        `${ticketNumber} - ${title}`,

      type: "ticket_created",
    }));

    if (
      notifications.length > 0
    ) {
      await Notification.insertMany(
        notifications
      );
    }

    // ==================================================
    // SEND EMAILS
    // ==================================================

    try {
      const ticketUser =
        await User.findById(
          req.user.id
        );

      // ----------------------------------------------
      // USER EMAIL
      // ----------------------------------------------

      if (ticketUser?.email) {
        await sendEmail({
          to: ticketUser.email,

          subject:
            `Ticket ${ticketNumber} created successfully`,

          html: ticketUserEmail({
            ...ticket._doc,

            userEmail:
              ticketUser.email,
          }),
        });
      }

      // ----------------------------------------------
      // ADMIN EMAILS
      // ----------------------------------------------

      const adminRecipients = [
        ...companyUsers,
        ...superAdmins,
      ]
        .filter(
          (user, index, arr) =>
            arr.findIndex(
              (u) =>
                u.email === user.email
            ) === index
        )
        .map(
          (user) => user.email
        )
        .filter(Boolean);

      if (
        adminRecipients.length > 0
      ) {
        await sendEmail({
          to: adminRecipients,

          subject:
            `New Ticket Created - ${ticketNumber}`,

          html: ticketAdminEmail({
            ...ticket._doc,

            userEmail:
              ticketUser?.email || "",
          }),
        });
      }
    } catch (emailError) {
      console.error(
        "Failed to send ticket emails:",
        emailError.message
      );
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Ticket created successfully",

      data: ticket,
    });
  } catch (error) {
    console.error(
      "Create ticket error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to create ticket",
    });
  }
};

/* ======================================================
   ✅ GET USER TICKETS
====================================================== */
export const getUserTickets = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 5;

    const tickets = await Ticket.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments({
      userId: req.user.id,
    });

    res.json({
      success: true,
      data: tickets,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ GET ALL TICKETS (ADMIN)
====================================================== */
export const getAllTickets = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    let filter = {};

    if (req.user.role === "it_support" || req.user.role === "company_admin") {
      filter = {
        companyId: req.user.companyId,
      };
    } else if (req.user.role === "super_admin") {
      filter = {};
    }

    const tickets = await Ticket.find(filter)
      .populate("userId", "name email employeeId department position")
      .populate("employeeId", "name staffCode department designation")
      .populate("companyId", "name code")
      .populate({ path: "escalation.escalatedBy", select: "name email", strictPopulate: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ======================================================
   ✅ GET SINGLE TICKET
====================================================== */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("userId", "name email employeeId")
      .populate("employeeId", "name staffCode department designation")
      .populate("companyId", "name code")
      .populate({ path: "escalation.escalatedBy", select: "name email", strictPopulate: false });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (req.user.role !== "super_admin") {
      const ticketCompanyId =
        ticket.companyId && ticket.companyId._id
          ? ticket.companyId._id.toString()
          : ticket.companyId?.toString();
      const userCompanyId = req.user.companyId
        ? req.user.companyId.toString()
        : null;

      if (ticketCompanyId && ticketCompanyId !== userCompanyId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ======================================================
   ✅ UPDATE STATUS (ADMIN)
====================================================== */
export const updateStatus = async (req, res) => {
  try {
    const { status, slaBreachReason } = req.body; // ADDED: slaBreachReason

    const allowed = ["Open", "In Progress", "Resolved", "Closed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = status;

    // ============================
    // IN PROGRESS
    // ============================
    if (status === "In Progress") {
      ticket.inProgressAt = new Date();

      // Record first response only once
      if (!ticket.sla.firstRespondedAt) {
        ticket.sla.firstRespondedAt = new Date();

        if (
          ticket.sla.firstRespondedAt >
          ticket.sla.firstResponseDue
        ) {
          ticket.sla.firstResponseBreached = true;

          // ADDED: capture reason for first-response breach, if provided
          if (slaBreachReason?.trim()) {
            ticket.sla.firstResponseBreachReason = slaBreachReason.trim();
          }
        }
      }
    }

    // ============================
    // RESOLVED
    // ============================
    if (status === "Resolved") {
      ticket.resolvedAt = new Date();

      ticket.sla.resolvedAt = ticket.resolvedAt;

      if (
        ticket.resolvedAt >
        ticket.sla.resolutionDue
      ) {
        ticket.sla.resolutionBreached = true;
        ticket.sla.status = "Breached";

        // ADDED: only overwrite if a reason was actually provided
        if (slaBreachReason?.trim()) {
          ticket.sla.breachReason = slaBreachReason.trim();
        }
      } else {
        ticket.sla.status = "Completed";
      }
    }

    // ============================
    // CLOSED
    // ============================
    if (status === "Closed") {
      ticket.closedAt = new Date();
    }

    // ============================
    // REOPEN
    // ============================
    if (status === "Open") {
      ticket.reopened = true;
      ticket.reopenedAt = new Date();

      ticket.resolvedAt = null;
      ticket.closedAt = null;

      // Reset SLA Resolution Status
      ticket.sla.resolvedAt = null;
      ticket.sla.resolutionBreached = false;
      ticket.sla.status = "Running";

      // ADDED: clear the old breach reason on reopen since resolution
      // is being redone from scratch
      ticket.sla.breachReason = "";
    }

    // ============================
    // STATUS HISTORY
    // ============================
    ticket.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user.id,
      note: `Status changed to ${status}`,
    });

    await ticket.save();

    // ============================
    // EMAIL WHEN RESOLVED
    // ============================
    if (status === "Resolved") {
      const ticketUser = await User.findById(ticket.userId);

      if (ticketUser?.email) {
        try {
          await sendEmail({
            to: ticketUser.email,
            subject: "Your ticket has been resolved",
            html: ticketResolvedEmail({
              ...ticket._doc,
              userEmail: ticketUser.email,
            }),
          });
        } catch (emailError) {
          console.error(
            "Failed to send resolved ticket email:",
            emailError.message
          );
        }
      }
    }

    // ============================
    // NOTIFICATION
    // ============================
    await Notification.create({
      userId: ticket.userId,
      title: "Ticket Status Updated",
      message: `Your ticket "${ticket.title}" is now ${status}`,
      type: "status",
    });

    res.json({
      success: true,
      message: "Status updated successfully",
      data: ticket,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ======================================================
   ✅ EDIT TICKET (USER)
====================================================== */
export const editTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit resolved ticket",
      });
    }

    const { title, description, department, relatedTo, priority } = req.body;

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (department) ticket.department = department;
    if (relatedTo) ticket.relatedTo = relatedTo;
    if (priority) ticket.priority = priority;

    if (req.files?.length > 0) {
      const newFiles = req.files.map((f) => f.path);
      ticket.attachments.push(...newFiles);
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ DELETE ATTACHMENT
====================================================== */
export const deleteAttachment = async (req, res) => {
  try {
    const { attachment } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.attachments = ticket.attachments.filter(
      (a) => a !== attachment
    );

    await ticket.save();

    res.json({
      success: true,
      message: "Attachment removed",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ USER CONFIRM RESOLUTION
====================================================== */
export const confirmResolution = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    ticket.status = "Closed";
    ticket.closedAt = new Date();

    await ticket.save();
    // Create notification for admins
    const admins = await User.find({
      role: { $in: ["company_admin", "super_admin", "it_support"] },
    });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: "Ticket Closed by User",
        message: `User confirmed resolution for ticket: "${ticket.title}"`,
        type: "status",
      });
    }


    res.json({
      success: true,
      message: "Ticket confirmed",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ REOPEN TICKET
====================================================== */
export const reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Create notification for admins
    const admins = await User.find({
      role: { $in: ["company_admin", "super_admin", "it_support"] },
    });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: "Ticket Reopened",
        message: `User reopened ticket: "${ticket.title}"`,
        type: "status",
      });
    }

    ticket.status = "Open";
    ticket.reopened = true;
    ticket.reopenedAt = new Date();

    ticket.resolvedAt = null;
    ticket.closedAt = null;

    await ticket.save();

    res.json({
      success: true,
      message: "Ticket reopened",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ ADD REVIEW
====================================================== */
export const addReview = async (req, res) => {
  try {
    const { review, rating } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowedStatuses = ["Resolved", "Closed"];
    if (!allowedStatuses.includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Only resolved or closed tickets can be reviewed",
      });
    }

    ticket.review = review;
    ticket.rating = rating;
    ticket.reviewedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: "Review saved successfully",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ======================================================
   ✅ STATS
====================================================== */
export const getTicketStats = async (req, res) => {
  try {
    const filter =
      req.user.role === "super_admin"
        ? {}
        : { companyId: req.user.companyId };

    const total = await Ticket.countDocuments(filter);

    const open = await Ticket.countDocuments({
      ...filter,
      status: "Open",
    });

    const inProgress = await Ticket.countDocuments({
      ...filter,
      status: "In Progress",
    });

    const resolved = await Ticket.countDocuments({
      ...filter,
      status: "Resolved",
    });

    const closed = await Ticket.countDocuments({
      ...filter,
      status: "Closed",
    });

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ======================================================
   ✅ DELETE TICKET
====================================================== */
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (
      req.user.role !== "super_admin" &&
      ticket.companyId.toString() !==
      req.user.companyId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await ticket.deleteOne();

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const createManualTicket = async (req, res) => {
  try {

    const {
      title,
      description,
      priority,
      department,
      relatedTo,
      assetId,
      employeeId,
      incidentDate
    } = req.body;


    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Please select the employee this ticket is for",
      });
    }


    const ticket = await Ticket.create({

      // =========================
      // COMPANY
      // =========================
      companyId: req.user.companyId,


      // =========================
      // BASIC INFO
      // =========================
      title,

      description,

      department: department || "General",

      relatedTo: relatedTo || "Others",


      // =========================
      // PRIORITY
      // =========================
      priority: priority || "Low",


      // =========================
      // STATUS
      // =========================
      status: "Open",
      assignedRole: "it_support",
      assignedTo: req.user._id,


      // =========================
      // ASSET LINK
      // =========================
      assetId: assetId || null,


      // =========================
      // EMPLOYEE LINK (who the ticket is for)
      // =========================
      employeeId: employeeId,


      // =========================
      // MANUAL TICKET
      // =========================
      source: "Manual",

      createdByType: "it_support",


      // No portal end user — this was raised on behalf of an employee
      userId: null,


      // =========================
      // INCIDENT DATE
      // =========================
      incidentDate: incidentDate || new Date(),



      // =========================
      // STATUS HISTORY
      // =========================
      statusHistory: [
        {
          status: "Open",

          changedBy: req.user._id,

          note: "Ticket created manually by IT Support",

          changedAt: new Date()
        }
      ]

    });

    // Populate the employee so the response (and any caller re-rendering
    // the list from this response) has the name/staffCode immediately.
    await ticket.populate("employeeId", "name staffCode department designation");

    return res.status(201).json({

      success: true,

      message: "Manual ticket created successfully",

      ticket

    });



  } catch (error) {

    console.error("Create Manual Ticket Error:", error);


    return res.status(500).json({

      success: false,

      message: error.message

    });

  }
};

export const escalateTicket = async (req, res) => {
  try {
    const { reason } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (req.user.role !== "it_support") {
      return res.status(403).json({
        success: false,
        message: "Only IT Support can escalate tickets",
      });
    }

    ticket.assignedRole = "super_admin";

    ticket.escalated = true;

    ticket.escalatedAt = new Date();

    ticket.escalatedBy = req.user._id;

    ticket.escalationReason = reason;

    ticket.sla.escalated = true;

    ticket.sla.escalationLevel += 1;

    ticket.sla.escalatedAt = new Date();

    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: `Escalated to Super Admin : ${reason}`,
    });

    await ticket.save();

    // Notify Super Admins
    const admins = await User.find({ role: "super_admin" });

    await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        title: "Ticket Escalated",
        message: `${ticket.title} requires Super Admin attention`,
        type: "ticket_escalated",
      }))
    );

    res.json({
      success: true,
      message: "Ticket escalated successfully",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



export const addSlaBreachReason = async (req, res) => {
  try {
    const { reason, leg } = req.body; // leg: "response" | "resolution"

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (leg === "response") {
      ticket.sla.firstResponseBreachReason = reason.trim();
    } else {
      // default to resolution leg
      ticket.sla.breachReason = reason.trim();
    }

    await ticket.save();

    res.json({
      success: true,
      message: "SLA breach reason saved",
      data: ticket,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};