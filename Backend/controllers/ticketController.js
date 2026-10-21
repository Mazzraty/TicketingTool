import mongoose from "mongoose";
import Ticket from "../models/ticketSchema.js";
import Company from "../models/comapnySchema.js";
import Employee from "../models/employeeMasterSchema.js";
import Asset from "../models/assetSchema.js";
import User from "../models/userShema.js";
import sendEmail from "../utils/sendEmail.js";
import { ticketAdminEmail } from "../utils/ticketAdminEmail.js";
import { ticketUserEmail } from "../utils/ticketUserEmail.js";
import { ticketResolvedEmail } from "../utils/ticketResolvedEmail.js";
import Notification from "../models/notifcationSchema.js";
import { generateTicketNumber } from "../utils/generateTicketNumber.js";

/* ======================================================
   HELPERS
====================================================== */

// Keep in sync with REMINDER_COOLDOWN_HOURS in MyTickets.jsx
const REMINDER_COOLDOWN_HOURS = 4;

// Days after "Resolved" before the ticket is auto-closed
// (keep in sync with the cron in crons/autoCloseTickets.js)
const AUTO_CLOSE_DAYS = 7;

// Escape user-typed text before putting it inside email HTML
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Log the real error, send a generic message to the client
const serverError = (res, err, fallback = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: fallback });
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// super_admin can touch any ticket; everyone else only their own company's
const canAccessTicket = (user, ticket) =>
  user.role === "super_admin" ||
  String(ticket.companyId?._id || ticket.companyId) === String(user.companyId);

const invalidId = (res) =>
  res.status(400).json({ success: false, message: "Invalid ticket ID" });

const accessDenied = (res) =>
  res.status(403).json({ success: false, message: "Access denied" });

/* ======================================================
   ✅ CREATE TICKET
====================================================== */
export const createTicket = async (req, res) => {
  try {
    // NOTE: `department` is intentionally NOT read from the request body.
    // It is taken from the requester's employee master record below.
    const { title, description, relatedTo, priority } = req.body;

    // ==================================================
    // COMPANY ID
    // ==================================================
    const companyId =
      req.user.companyId ||
      req.user.companyAccess?.find((c) => c.isActive && c.companyId)
        ?.companyId ||
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
    const ticketNumber = await generateTicketNumber(companyId, companyCode);

    // ==================================================
    // REQUESTER'S REAL DEPARTMENT (from the employee master)
    // ==================================================
    const requester = await User.findById(req.user.id).populate(
      "employeeRef",
      "department"
    );

    let employeeRecord = requester?.employeeRef || null;

    // Fallback for users that were never linked through employeeRef.
    // Scoped to the ticket's company because staff codes are only
    // unique inside a company.
    if (!employeeRecord && requester?.staffCode) {
      employeeRecord = await Employee.findOne({
        staffCode: requester.staffCode,
        companyId,
      }).select("department");
    }

    const department =
      employeeRecord?.department?.trim() ||
      requester?.department?.trim() ||
      "General";

    // ==================================================
    // SLA POLICY
    // ==================================================
    const slaPolicy = {
      Low: { firstResponse: 8, resolution: 72 },
      Medium: { firstResponse: 4, resolution: 48 },
      High: { firstResponse: 2, resolution: 24 },
      Critical: { firstResponse: 0.5, resolution: 8 },
    };

    const policy = slaPolicy[priority] || slaPolicy.Low;

    // ==================================================
    // ATTACHMENTS
    // ==================================================
    const attachments = (req.files || []).map((file) => file.path);

    // ==================================================
    // CREATE TICKET
    // ==================================================
    const ticket = await Ticket.create({
      ticketNumber,
      companyId,

      // BASIC INFORMATION
      title,
      description,
      department,
      relatedTo: relatedTo || "Others",
      priority,
      attachments,

      // USER
      userId: req.user.id,
      employeeId: employeeRecord?._id || null,

      // STATUS
      status: "Open",

      // ASSIGNMENT
      assignedRole: "it_support",
      assignedTo: null,

      // ESCALATION
      escalation: {
        isEscalated: false,
        level: 0,
        reason: "",
        escalatedBy: null,
        escalatedTo: null,
        escalatedAt: null,
      },

      // SLA
      sla: {
        priority,
        firstResponseDue: new Date(
          Date.now() + policy.firstResponse * 60 * 60 * 1000
        ),
        resolutionDue: new Date(
          Date.now() + policy.resolution * 60 * 60 * 1000
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

      // REVIEW
      review: "",
      rating: 0,
      ratingSource: null,
      reviewedAt: null,

      // TIMESTAMPS
      inProgressAt: null,
      resolvedAt: null,
      closedAt: null,
      autoCloseAt: null,
      reopened: false,
      reopenedAt: null,

      // REMINDERS
      lastReminderAt: null,
      reminderCount: 0,

      // INCIDENT DATE
      incidentDate: new Date(),

      // SOURCE
      source: "Portal",
      createdByType: req.user.role || "user",

      // STATUS HISTORY
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
    const companyUsers = await User.find({
      companyId,
      role: { $in: ["company_admin", "it_support"] },
    });

    // ==================================================
    // FIND SUPER ADMINS
    // ==================================================
    const superAdmins = await User.find({ role: "super_admin" });

    // ==================================================
    // REMOVE DUPLICATE USERS
    // ==================================================
    const uniqueUsers = new Map();

    [...companyUsers, ...superAdmins].forEach((user) => {
      uniqueUsers.set(user._id.toString(), user);
    });

    // ==================================================
    // CREATE NOTIFICATIONS
    // ==================================================
    const notifications = [...uniqueUsers.values()].map((user) => ({
      userId: user._id,
      companyId,
      title: "New Ticket",
      message: `${ticketNumber} - ${title}`,
      type: "ticket_created",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // ==================================================
    // SEND EMAILS
    // ==================================================
    try {
      const ticketUser = await User.findById(req.user.id);

      // USER EMAIL
      if (ticketUser?.email) {
        await sendEmail({
          to: ticketUser.email,
          subject: `Ticket ${ticketNumber} created successfully`,
          html: ticketUserEmail({
            ...ticket._doc,
            userEmail: ticketUser.email,
          }),
        });
      }

      // ADMIN EMAILS
      const adminRecipients = [...companyUsers, ...superAdmins]
        .filter(
          (user, index, arr) =>
            arr.findIndex((u) => u.email === user.email) === index
        )
        .map((user) => user.email)
        .filter(Boolean);

      if (adminRecipients.length > 0) {
        await sendEmail({
          to: adminRecipients,
          subject: `New Ticket Created - ${ticketNumber}`,
          html: ticketAdminEmail({
            ...ticket._doc,
            userEmail: ticketUser?.email || "",
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send ticket emails:", emailError.message);
    }

    // ==================================================
    // RESPONSE
    // ==================================================
    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    return serverError(res, error, "Failed to create ticket");
  }
};

/* ======================================================
   ✅ GET USER TICKETS
====================================================== */
export const getUserTickets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 5;
    const { status, search } = req.query;

    const filter = { userId: req.user.id };

    // Status filter (ignore "all" / empty)
    const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];
    if (status && allowedStatuses.includes(status)) {
      filter.status = status;
    }

    // Search by ticket number, title or description
    if (typeof search === "string" && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [
        { ticketNumber: regex },
        { title: regex },
        { description: regex },
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tickets,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ GET ALL TICKETS (ADMIN)
====================================================== */
export const getAllTickets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 10));

    let filter = {};

    if (req.user.role === "it_support" || req.user.role === "company_admin") {
      filter = {
        companyId: req.user.companyId,
      };
    } else if (req.user.role === "super_admin") {
      // super_admin can optionally scope the list to a single company
      // via ?companyId=..., otherwise sees every company's tickets
      const queryCompanyId =
        typeof req.query.companyId === "string" && isValidId(req.query.companyId)
          ? req.query.companyId
          : null;
      const selectedCompanyId = req.user.companyId || queryCompanyId;
      filter = selectedCompanyId ? { companyId: selectedCompanyId } : {};
    }

    const tickets = await Ticket.find(filter)
      .populate("userId", "name email employeeId department position")
      .populate("employeeId", "name staffCode department designation")
      .populate("companyId", "name code")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name email role")
      .populate({
        path: "escalation.escalatedBy",
        select: "name email",
        strictPopulate: false,
      })
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
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ GET SINGLE TICKET
====================================================== */
export const getTicketById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id)
      .populate("userId", "name email employeeId")
      .populate("employeeId", "name staffCode department designation")
      .populate("companyId", "name code")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name email role")
      .populate({
        path: "escalation.escalatedBy",
        select: "name email",
        strictPopulate: false,
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // the ticket's own creator may always view it; admins only within their company
    const isOwner =
      ticket.userId &&
      String(ticket.userId._id || ticket.userId) === String(req.user.id);

    if (!isOwner && !canAccessTicket(req.user, ticket)) {
      return accessDenied(res);
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ UPDATE STATUS (ADMIN)
====================================================== */
export const updateStatus = async (req, res) => {
  try {
    const {
      status,
      slaBreachReason,
      resolutionNote,
      rejectionReason,
      resolutionType,
      vendorName,
      complaintDescription,
      repairDate,
      cost,
    } = req.body;

    if (!isValidId(req.params.id)) return invalidId(res);

    const allowed = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // only super_admin can reject a ticket
    if (status === "Rejected" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can reject a ticket",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(req.user, ticket)) return accessDenied(res);

    ticket.status = status;

    if (typeof resolutionNote === "string" && resolutionNote.trim()) {
      ticket.resolutionNote = resolutionNote.trim();
    }

    // ============================
    // RESOLUTION TYPE / VENDOR DETAILS
    // Only relevant when the ticket is actually being resolved/closed.
    // ============================
    let vendorSummaryForHistory = "";

    if ((status === "Resolved" || status === "Closed") && resolutionType) {
      const allowedResolutionTypes = ["Internal", "External Vendor"];

      if (!allowedResolutionTypes.includes(resolutionType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid resolution type",
        });
      }

      ticket.resolutionType = resolutionType;

      if (resolutionType === "External Vendor") {
        if (
          !vendorName?.trim() ||
          !complaintDescription?.trim() ||
          !repairDate ||
          cost === undefined ||
          cost === null ||
          cost === ""
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Vendor name, complaint/repair description, repair date and cost are all required for an external vendor resolution",
          });
        }

        const parsedCost = Number(cost);
        if (Number.isNaN(parsedCost) || parsedCost < 0) {
          return res.status(400).json({
            success: false,
            message: "Cost must be a valid positive number",
          });
        }

        const parsedRepairDate = new Date(repairDate);
        if (Number.isNaN(parsedRepairDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Repair date is invalid",
          });
        }

        // A new receipt upload (req.file, from multer) always wins; if
        // none was sent this time (e.g. editing other fields later),
        // keep whatever receipt was already on file.
        const receiptUrl = req.file
          ? req.file.path
          : ticket.vendorDetails?.receiptUrl || "";

        ticket.vendorDetails = {
          vendorName: vendorName.trim(),
          complaintDescription: complaintDescription.trim(),
          repairDate: parsedRepairDate,
          cost: parsedCost,
          receiptUrl,
        };

        vendorSummaryForHistory = ` (External Vendor: ${vendorName.trim()}, cost ${parsedCost})`;
      } else {
        // Internal resolution — no vendor record needed.
        vendorSummaryForHistory = " (Internal resolution)";
      }
    }

    // ============================
    // IN PROGRESS
    // ============================
    if (status === "In Progress") {
      ticket.inProgressAt = new Date();

      // Record first response only once
      if (!ticket.sla.firstRespondedAt) {
        ticket.sla.firstRespondedAt = new Date();

        if (ticket.sla.firstRespondedAt > ticket.sla.firstResponseDue) {
          ticket.sla.firstResponseBreached = true;

          // capture reason for first-response breach, if provided
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

      // Start the 7-day auto-close countdown. The employee can rate or
      // reopen during this window; the cron closes the ticket afterwards.
      ticket.autoCloseAt = new Date(
        ticket.resolvedAt.getTime() + AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000
      );

      if (ticket.resolvedAt > ticket.sla.resolutionDue) {
        ticket.sla.resolutionBreached = true;
        ticket.sla.status = "Breached";

        // only overwrite if a reason was actually provided
        if (slaBreachReason?.trim()) {
          ticket.sla.breachReason = slaBreachReason.trim();
        }
      } else {
        ticket.sla.status = "Completed";
      }
    }

    // ============================
    // REJECTED
    // ============================
    if (status === "Rejected") {
      if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "A reason is required to reject a ticket",
        });
      }
      ticket.rejectedAt = new Date();
      ticket.rejectionReason = rejectionReason.trim();
      ticket.autoCloseAt = null;
    }

    // ============================
    // CLOSED
    // ============================
    if (status === "Closed") {
      ticket.closedAt = new Date();
      ticket.autoCloseAt = null;
    }

    // ============================
    // REOPEN
    // ============================
    if (status === "Open") {
      ticket.reopened = true;
      ticket.reopenedAt = new Date();

      ticket.resolvedAt = null;
      ticket.closedAt = null;

      // Cancel the pending auto-close countdown
      ticket.autoCloseAt = null;

      // Discard a system-given default rating so the next resolution
      // can be rated fresh by the employee
      if (ticket.ratingSource === "auto") {
        ticket.rating = 0;
        ticket.ratingSource = null;
        ticket.reviewedAt = null;
      }

      // Reset SLA Resolution Status
      ticket.sla.resolvedAt = null;
      ticket.sla.resolutionBreached = false;
      ticket.sla.status = "Running";

      // clear the old breach reason on reopen since resolution
      // is being redone from scratch
      ticket.sla.breachReason = "";
    }

    // ============================
    // STATUS HISTORY
    // (notes starting "Status changed to" / "Ticket rejected" are what the
    //  admin UI uses to show who moved the ticket to each status)
    // ============================
    ticket.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user.id,
      note:
        status === "Rejected"
          ? `Ticket rejected: ${rejectionReason.trim()}`
          : status === "Resolved"
          ? `Status changed to ${status}${vendorSummaryForHistory}. Auto-closes in ${AUTO_CLOSE_DAYS} days unless reopened.`
          : `Status changed to ${status}${vendorSummaryForHistory}`,
    });

    await ticket.save();

    // ============================
    // EMAIL WHEN RESOLVED
    // (update the ticketResolvedEmail template to mention: rate 1-5 stars
    //  or reopen within 7 days, otherwise the ticket closes automatically)
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
              autoCloseDays: AUTO_CLOSE_DAYS,
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
    // NOTIFICATION (portal tickets only — manual tickets have no userId)
    // ============================
    if (ticket.userId) {
      const isResolved = status === "Resolved";

      await Notification.create({
        userId: ticket.userId,
        companyId: ticket.companyId,
        title: isResolved
          ? "Rate Your Support Experience"
          : "Ticket Status Updated",
        message: isResolved
          ? `Your ticket ${ticket.ticketNumber} was resolved. Please rate it from 1 to 5 stars, or reopen it if the issue persists. It will auto-close in ${AUTO_CLOSE_DAYS} days.`
          : `Your ticket "${ticket.title}" is now ${status}`,
        type: isResolved ? "rating_request" : "status",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ EDIT TICKET (USER)
====================================================== */
export const editTicket = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.userId || ticket.userId.toString() !== req.user.id) {
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
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ DELETE ATTACHMENT
   Allowed for the ticket's creator, or an admin of the same company.
====================================================== */
export const deleteAttachment = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const { attachment } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isOwner =
      ticket.userId && ticket.userId.toString() === String(req.user.id);
    const isAdminOfCompany =
      ["super_admin", "company_admin", "it_support"].includes(req.user.role) &&
      canAccessTicket(req.user, ticket);

    if (!isOwner && !isAdminOfCompany) return accessDenied(res);

    ticket.attachments = ticket.attachments.filter((a) => a !== attachment);

    await ticket.save();

    res.json({
      success: true,
      message: "Attachment removed",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ USER CONFIRM RESOLUTION
====================================================== */
export const confirmResolution = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.userId || ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (ticket.status === "Closed") {
      return res.json({
        success: true,
        message: "Ticket already confirmed",
        data: ticket,
      });
    }

    if (ticket.status !== "Resolved") {
      return res.status(409).json({
        success: false,
        message: "Ticket must be resolved before it can be confirmed",
      });
    }

    const confirmedTicket = await Ticket.findOneAndUpdate(
      { _id: ticket._id, userId: req.user.id, status: "Resolved" },
      {
        $set: { status: "Closed", closedAt: new Date(), autoCloseAt: null },
        // record who closed it so the admin UI can show "Closed by"
        $push: {
          statusHistory: {
            status: "Closed",
            changedAt: new Date(),
            changedBy: req.user.id,
            note: "Status changed to Closed (confirmed by user)",
          },
        },
      },
      { new: true }
    );

    if (!confirmedTicket) {
      const latestTicket = await Ticket.findById(req.params.id);

      if (!latestTicket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      if (!latestTicket.userId || latestTicket.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (latestTicket.status === "Closed") {
        return res.json({
          success: true,
          message: "Ticket already confirmed",
          data: latestTicket,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Ticket must be resolved before it can be confirmed",
      });
    }

    // Create notification for admins
    const admins = await User.find({
      companyId: confirmedTicket.companyId,
      role: { $in: ["company_admin", "super_admin", "it_support"] },
    });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        companyId: confirmedTicket.companyId,
        title: "Ticket Closed by User",
        message: `User confirmed resolution for ticket: "${confirmedTicket.title}"`,
        type: "status",
      });
    }

    res.json({
      success: true,
      message: "Ticket confirmed",
      data: confirmedTicket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ REOPEN TICKET (USER)
   Cancels the pending 7-day auto-close countdown.
====================================================== */
export const reopenTicket = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.userId || ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // To allow reopening ONLY during the 7-day Resolved window,
    // change this to: if (ticket.status !== "Resolved")
    if (!["Resolved", "Closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Only resolved or closed tickets can be reopened",
      });
    }

    ticket.status = "Open";
    ticket.reopened = true;
    ticket.reopenedAt = new Date();

    ticket.resolvedAt = null;
    ticket.closedAt = null;

    // cancel the pending auto-close
    ticket.autoCloseAt = null;

    // discard a system-given default rating so the next resolution
    // can be rated fresh
    if (ticket.ratingSource === "auto") {
      ticket.rating = 0;
      ticket.ratingSource = null;
      ticket.reviewedAt = null;
    }

    // reset resolution SLA, same as updateStatus -> Open
    ticket.sla.resolvedAt = null;
    ticket.sla.resolutionBreached = false;
    ticket.sla.status = "Running";
    ticket.sla.breachReason = "";

    ticket.statusHistory.push({
      status: "Open",
      changedAt: new Date(),
      changedBy: req.user.id,
      note: "Ticket reopened by user. Auto-close cancelled.",
    });

    await ticket.save();

    // Notify admins
    const admins = await User.find({
      companyId: ticket.companyId,
      role: { $in: ["company_admin", "super_admin", "it_support"] },
    });

    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          companyId: ticket.companyId,
          title: "Ticket Reopened",
          message: `User reopened ticket: "${ticket.title}"`,
          type: "status",
        }))
      );
    }

    res.json({
      success: true,
      message: "Ticket reopened",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ SEND REMINDER (USER) — only while ticket is In Progress
====================================================== */
export const sendTicketReminder = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.userId || ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (ticket.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "Reminders can only be sent for tickets that are In Progress",
      });
    }

    // Cooldown so the support team doesn't get spammed
    if (ticket.lastReminderAt) {
      const cooldownMs = REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(ticket.lastReminderAt).getTime();

      if (elapsed < cooldownMs) {
        const minsLeft = Math.ceil((cooldownMs - elapsed) / 60000);
        return res.status(429).json({
          success: false,
          message: `You already sent a reminder recently. Try again in ${
            minsLeft >= 60
              ? `${Math.ceil(minsLeft / 60)} hour(s)`
              : `${minsLeft} minute(s)`
          }.`,
        });
      }
    }

    const note =
      typeof req.body?.message === "string"
        ? req.body.message.trim().slice(0, 500)
        : "";

    ticket.lastReminderAt = new Date();
    ticket.reminderCount = (ticket.reminderCount || 0) + 1;

    ticket.statusHistory.push({
      status: ticket.status,
      changedAt: new Date(),
      changedBy: req.user.id,
      note: `Reminder #${ticket.reminderCount} sent by user${
        note ? `: ${note}` : ""
      }`,
    });

    await ticket.save();

    // ---------- Who to notify ----------
    const supportRoles = ["it_support", "company_admin"];
    const recipientFilters = [
      { role: "super_admin" },
      {
        companyId: ticket.companyId,
        role: { $in: supportRoles },
      },
      {
        companyAccess: {
          $elemMatch: {
            companyId: ticket.companyId,
            isActive: true,
            role: { $in: supportRoles },
          },
        },
      },
    ];

    if (ticket.assignedTo) {
      recipientFilters.push({ _id: ticket.assignedTo });
    }

    const recipients = await User.find({ $or: recipientFilters });

    const unique = new Map();
    recipients.forEach((u) => unique.set(u._id.toString(), u));
    const finalRecipients = [...unique.values()];

    if (finalRecipients.length > 0) {
      await Notification.insertMany(
        finalRecipients.map((u) => ({
          userId: u._id,
          companyId: ticket.companyId,
          title: "Ticket Reminder",
          message: `Reminder on ${ticket.ticketNumber} - ${ticket.title}`,
          type: "ticket_reminder",
        }))
      );

      // Email (failure must not break the request)
      try {
        const emails = finalRecipients.map((u) => u.email).filter(Boolean);
        if (emails.length > 0) {
          await sendEmail({
            to: emails,
            subject: `Reminder: Ticket ${ticket.ticketNumber} is still pending`,
            html: `
              <p>The user has sent a reminder for ticket <b>${escapeHtml(
                ticket.ticketNumber
              )}</b>.</p>
              <p><b>Title:</b> ${escapeHtml(ticket.title)}</p>
              <p><b>Priority:</b> ${escapeHtml(ticket.priority)}</p>
              <p><b>Reminders sent so far:</b> ${ticket.reminderCount}</p>
              ${note ? `<p><b>User note:</b> ${escapeHtml(note)}</p>` : ""}
            `,
          });
        }
      } catch (emailError) {
        console.error("Failed to send reminder email:", emailError.message);
      }
    }

    res.json({
      success: true,
      message: "Reminder sent to the support team",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ ADD REVIEW (USER)
   Rating 1-5. Overrides the system's auto 5-star if present.
====================================================== */
export const addReview = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const { review, rating } = req.body;
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.userId || ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const allowedStatuses = ["Resolved", "Closed"];
    if (!allowedStatuses.includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Only resolved or closed tickets can be reviewed",
      });
    }

    // Allow overriding the auto 5-star, block double user ratings
    if (ticket.rating > 0 && ticket.ratingSource === "user") {
      return res.status(409).json({
        success: false,
        message: "This ticket has already been rated",
      });
    }

    ticket.review = typeof review === "string" ? review.trim().slice(0, 1000) : "";
    ticket.rating = numericRating;
    ticket.ratingSource = "user";
    ticket.reviewedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: "Review saved successfully",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ STATS
====================================================== */
export const getTicketStats = async (req, res) => {
  try {
    // super_admin can optionally scope the stats to a single company
    // via ?companyId=..., matching the same behaviour as getAllTickets
    let filter;

    if (req.user.role === "super_admin") {
      const queryCompanyId =
        typeof req.query.companyId === "string" && isValidId(req.query.companyId)
          ? req.query.companyId
          : null;
      const selectedCompanyId = req.user.companyId || queryCompanyId;
      filter = selectedCompanyId ? { companyId: selectedCompanyId } : {};
    } else {
      filter = { companyId: req.user.companyId };
    }

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
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ DELETE TICKET
====================================================== */
export const deleteTicket = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(req.user, ticket)) return accessDenied(res);

    await ticket.deleteOne();

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ CREATE MANUAL TICKET (SUPER ADMIN / IT SUPPORT)
====================================================== */
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
      externalName, // name of requester outside the company
      incidentDate,
      companyId: bodyCompanyId,
    } = req.body;

    // ==================================================
    // COMPANY ID
    // ==================================================
    // super_admin has access to every company, so they must explicitly
    // pick one on the form (sent as companyId in the body). Everyone else
    // is scoped to their own assigned company, same as createTicket.
    let companyId;

    if (req.user.role === "super_admin") {
      if (!req.user.companyId && !bodyCompanyId) {
        return res.status(400).json({
          success: false,
          message: "Please select a company",
        });
      }
      companyId = req.user.companyId || bodyCompanyId;
    } else {
      companyId =
        req.user.companyId ||
        req.user.companyAccess?.find((c) => c.isActive && c.companyId)
          ?.companyId ||
        req.user.companyAccess?.[0]?.companyId;
    }

    if (!companyId || !isValidId(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Company is not assigned to this user",
      });
    }

    // Find company and compute company code for ticket number
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

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

    // Validation (runs BEFORE generating a ticket number so a failed
    // request doesn't burn a number and leave a gap in the sequence)
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // ==================================================
    // REQUESTER: employee OR outside-company person (by name)
    // ==================================================
    const cleanExternalName =
      typeof externalName === "string" ? externalName.trim() : "";
    const isExternalRequester = !employeeId && !!cleanExternalName;

    if (!employeeId && !cleanExternalName) {
      return res.status(400).json({
        success: false,
        message: "Please select an employee or enter the requester's name",
      });
    }

    // Guard against a super admin picking an employee/asset that doesn't
    // actually belong to the selected company (e.g. stale client state).
    let employeeDepartment = "";

    if (employeeId) {
      if (!isValidId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee",
        });
      }
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      if (String(employee.companyId) !== String(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Selected employee does not belong to the selected company",
        });
      }
      employeeDepartment = employee.department?.trim() || "";
    }

    if (assetId) {
      if (!isValidId(assetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid asset",
        });
      }
      const asset = await Asset.findById(assetId);
      if (asset && String(asset.companyId) !== String(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Selected asset does not belong to the selected company",
        });
      }
    }

    // Generate ticket number for manual tickets as well
    const ticketNumber = await generateTicketNumber(companyId, companyCode);

    const ticket = await Ticket.create({
      // COMPANY
      companyId,

      // TICKET NUMBER
      ticketNumber,

      // BASIC INFO
      title,
      description,
      // Employee's real department wins; the form value is only a fallback
      // (e.g. outside-company requesters have no employee record)
      department: employeeDepartment || department?.trim() || "General",
      relatedTo: relatedTo || "Others",

      // PRIORITY
      priority: priority || "Low",

      // STATUS
      status: "Open",
      assignedRole: "it_support",
      assignedTo: req.user.id,

      // ASSET LINK
      assetId: assetId || null,

      // EMPLOYEE LINK (who the ticket is for) - null for outside requesters
      employeeId: employeeId || null,

      // OUTSIDE-COMPANY REQUESTER NAME
      externalName: isExternalRequester ? cleanExternalName : "",

      // MANUAL TICKET
      source: "Manual",
      createdByType:
        req.user.role === "super_admin" ? "super_admin" : "it_support",

      // No portal end user — this was raised on behalf of someone
      userId: null,

      // INCIDENT DATE
      incidentDate: incidentDate || new Date(),

      // STATUS HISTORY
      statusHistory: [
        {
          status: "Open",
          changedBy: req.user.id,
          note:
            req.user.role === "super_admin"
              ? "Ticket created manually by Super Admin"
              : "Ticket created manually by IT Support",
          changedAt: new Date(),
        },
      ],
    });

    // Populate the employee (if any) so the response has the
    // name/staffCode immediately.
    if (ticket.employeeId) {
      await ticket.populate(
        "employeeId",
        "name staffCode department designation"
      );
    }

    return res.status(201).json({
      success: true,
      message: "Manual ticket created successfully",
      ticket,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/* ======================================================
   ✅ ESCALATE TICKET (IT SUPPORT -> SUPER ADMIN)
====================================================== */
export const escalateTicket = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";

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

    if (!canAccessTicket(req.user, ticket)) return accessDenied(res);

    ticket.assignedRole = "super_admin";

    // Nested `escalation` object (matches ticketSchema).
    ticket.escalation.isEscalated = true;
    ticket.escalation.level = (ticket.escalation.level || 0) + 1;
    ticket.escalation.reason = reason;
    ticket.escalation.escalatedBy = req.user.id;
    ticket.escalation.escalatedAt = new Date();

    ticket.sla.escalated = true;
    ticket.sla.escalationLevel = (ticket.sla.escalationLevel || 0) + 1;
    ticket.sla.escalatedAt = new Date();

    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: req.user.id,
      changedAt: new Date(),
      note: `Escalated to Super Admin : ${reason}`,
    });

    await ticket.save();

    // Notify Super Admins
    const admins = await User.find({ role: "super_admin" });

    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          companyId: ticket.companyId,
          title: "Ticket Escalated",
          message: `${ticket.title} requires Super Admin attention`,
          type: "ticket_escalated",
        }))
      );
    }

    res.json({
      success: true,
      message: "Ticket escalated successfully",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ ADD SLA BREACH REASON
====================================================== */
export const addSlaBreachReason = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const { reason, leg } = req.body; // leg: "response" | "resolution"

    if (typeof reason !== "string" || !reason.trim()) {
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

    if (!canAccessTicket(req.user, ticket)) return accessDenied(res);

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
    return serverError(res, err);
  }
};

/* ======================================================
   ✅ UPDATE PRIORITY (SUPER ADMIN / IT SUPPORT)
====================================================== */
export const updateTicketPriority = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);

    const { priority } = req.body;
    const allowedPriorities = ["Low", "Medium", "High", "Critical"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    if (!["super_admin", "it_support"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to change priority",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // it_support is scoped to their own company; super_admin can touch any ticket
    if (!canAccessTicket(req.user, ticket)) return accessDenied(res);

    const oldPriority = ticket.priority;

    if (oldPriority === priority) {
      return res.json({
        success: true,
        message: "Priority unchanged",
        data: ticket,
      });
    }

    ticket.priority = priority;

    // Recompute whichever SLA legs haven't been hit yet, based on the new
    // priority's policy, anchored to the ticket's original creation time.
    const slaPolicy = {
      Low: { firstResponse: 8, resolution: 72 },
      Medium: { firstResponse: 4, resolution: 48 },
      High: { firstResponse: 2, resolution: 24 },
      Critical: { firstResponse: 0.5, resolution: 8 },
    };
    const policy = slaPolicy[priority] || slaPolicy.Low;

    if (!ticket.sla.firstRespondedAt) {
      ticket.sla.firstResponseDue = new Date(
        ticket.createdAt.getTime() + policy.firstResponse * 60 * 60 * 1000
      );
    }
    if (!ticket.sla.resolvedAt) {
      ticket.sla.resolutionDue = new Date(
        ticket.createdAt.getTime() + policy.resolution * 60 * 60 * 1000
      );
    }
    ticket.sla.priority = priority;

    ticket.statusHistory.push({
      status: ticket.status,
      changedAt: new Date(),
      changedBy: req.user.id,
      note: `Priority changed from ${oldPriority} to ${priority}`,
    });

    await ticket.save();

    res.json({
      success: true,
      message: "Priority updated successfully",
      data: ticket,
    });
  } catch (err) {
    return serverError(res, err);
  }
};