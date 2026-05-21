import Ticket from "../models/ticketSchema.js";
import User from "../models/userShema.js";

import sendEmail from "../utils/sendEmail.js";
import { ticketAdminEmail } from "../utils/ticketAdminEmail.js";
import { ticketUserEmail } from "../utils/ticketUserEmail.js";


// ======================================================
// ✅ CREATE TICKET
// ======================================================
export const createTicket = async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title & Description required",
      });
    }

    const attachments =
      req.files?.map((f) => f.path || f.filename) || [];

    const slaHours = {
      Low: 72,
      Medium: 24,
      High: 8,
      Critical: 2,
    };

    const slaDue = new Date(
      Date.now() + (slaHours[priority] || 72) * 3600000
    );

    const ticket = await Ticket.create({
      title,
      description,
      department,
      priority,
      attachments,
      userId: req.user.id,
      slaDue,

      reopened: false,
      review: "",
      rating: 0,
      resolvedAt: null,
      reopenedAt: null,
    });

    const user = await User.findById(req.user.id);
    const admins = await User.find({ role: "admin" });

    // EMAIL (non-blocking)
    sendEmail({
      to: admins.map((a) => a.email),
      subject: "New Ticket Created",
      html: ticketAdminEmail({ ...ticket._doc, userEmail: user.email }),
    });

    sendEmail({
      to: user.email,
      subject: "Ticket Created",
      html: ticketUserEmail(ticket),
    });

    // SOCKET
    if (global.io) {
      global.io.emit("newTicket", {
        ticket,
        user: { name: user.name, email: user.email },
      });
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ GET USER TICKETS
// ======================================================
export const getUserTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
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
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ GET ALL TICKETS (ADMIN)
// ======================================================
export const getAllTickets = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const total = await Ticket.countDocuments();

    const tickets = await Ticket.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: tickets,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ GET SINGLE TICKET
// ======================================================
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "userId",
      "name email"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ UPDATE STATUS (ADMIN ONLY)
// ======================================================
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ==========================
    // ✅ VALIDATE INPUT FIRST
    // ==========================
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // ==========================
    // ✅ ALLOWED STATUSES (MUST MATCH FRONTEND)
    // ==========================
    const allowedStatus = [
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
        allowedStatus,
      });
    }

    // ==========================
    // FIND TICKET
    // ==========================
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ==========================
    // UPDATE STATUS
    // ==========================
    ticket.status = status;

    // ==========================
    // AUTO TIMESTAMP HANDLING
    // ==========================
    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
    }

    if (status === "Closed") {
      ticket.closedAt = new Date();
    }

    if (status === "Open") {
      ticket.reopened = true;
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;
      ticket.review = "";
      ticket.rating = 0;
    }

    // ==========================
    // SAVE
    // ==========================
    await ticket.save();

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: ticket,
    });

  } catch (err) {
    console.error("❌ updateStatus error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//admin 

export const getTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const format = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };

    stats.forEach((s) => {
      format.total += s.count;

      if (s._id === "Open") format.open = s.count;
      if (s._id === "In Progress") format.inProgress = s.count;
      if (s._id === "Resolved") format.resolved = s.count;
      if (s._id === "Closed") format.closed = s.count;
    });

    res.json(format);

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// ✅ USER REOPEN TICKET (IMPORTANT FIX)
// ======================================================
export const reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    ticket.status = "Open";
    ticket.reopened = true;
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;

    await ticket.save();

    // SOCKET (NOT new ticket)
    if (global.io) {
      global.io.emit("ticketReopened", {
        ticketId: ticket._id,
        title: ticket.title,
      });
    }

    res.json({
      success: true,
      message: "Ticket reopened successfully",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ EDIT TICKET (OPEN / REOPEN ONLY)
// ======================================================
export const editTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!["Open", "Reopened"].includes(ticket.status)) {
      return res.status(400).json({
        message: "Only open/reopened tickets can be edited",
      });
    }

    const { title, description, department, priority } = req.body;

    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.department = department || ticket.department;
    ticket.priority = priority || ticket.priority;

    const slaHours = {
      Low: 72,
      Medium: 24,
      High: 8,
      Critical: 2,
    };

    if (priority) {
      ticket.slaDue = new Date(
        Date.now() + slaHours[priority] * 3600000
      );
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Ticket updated",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ ADD REVIEW
// ======================================================
export const addReview = async (req, res) => {
  try {
    const { review, rating } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== "Resolved") {
      return res.status(400).json({
        message: "Only resolved tickets can be reviewed",
      });
    }

    if (ticket.review) {
      return res.status(400).json({
        message: "Review already exists",
      });
    }

    ticket.review = review;
    ticket.rating = rating;

    await ticket.save();

    res.json({
      success: true,
      message: "Review added",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ DELETE TICKET
// ======================================================
export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ticket deleted",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};