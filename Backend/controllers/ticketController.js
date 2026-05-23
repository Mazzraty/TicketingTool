import Ticket from "../models/ticketSchema.js";
import User from "../models/userShema.js";
import sendEmail from "../utils/sendEmail.js";
import { ticketAdminEmail } from "../utils/ticketAdminEmail.js";
import { ticketUserEmail } from "../utils/ticketUserEmail.js";

/* ======================================================
   ✅ CREATE TICKET
====================================================== */
export const createTicket = async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description required",
      });
    }

    const attachments = req.files?.map((f) => f.path) || [];

    const slaHours = {
      Low: 72,
      Medium: 24,
      High: 8,
      Critical: 2,
    };

    const ticket = await Ticket.create({
      title,
      description,
      department,
      priority,
      attachments,
      userId: req.user.id,
      slaDue: new Date(Date.now() + (slaHours[priority] || 72) * 3600000),

      status: "Open",
      reopened: false,
      review: "",
      rating: 0,
      resolvedAt: null,
      closedAt: null,
      reopenedAt: null,
    });

    const user = await User.findById(req.user.id);
    const admins = await User.find({ role: "admin" });

    /* EMAIL (non-blocking) */
    sendEmail({
      to: admins.map((a) => a.email),
      subject: "New Ticket Created",
      html: ticketAdminEmail({ ...ticket._doc, userEmail: user.email }),
    });

    sendEmail({
      to: user.email,
      subject: "Ticket Created Successfully",
      html: ticketUserEmail(ticket),
    });

    /* SOCKET */
    if (global.io) {
      global.io.emit("newTicket", ticket);
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });

  } catch (err) {
    console.error("CREATE TICKET ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
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

    const total = await Ticket.countDocuments({ userId: req.user.id });

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

    const tickets = await Ticket.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments();

    res.json({
      success: true,
      data: tickets,
      page,
      pages: Math.ceil(total / limit),
      total,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ GET SINGLE TICKET
====================================================== */
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
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ UPDATE STATUS (ADMIN ONLY)
====================================================== */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

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

    /* ================= TIMELINE ================= */
    if (status === "In Progress") {
      ticket.inProgressAt = new Date();
    }

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
      ticket.closedAt = null;
    }

    await ticket.save();

    return res.json({
      success: true,
      message: "Status updated",
      data: ticket,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ USER REOPEN TICKET (IMPORTANT FIX)
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

    ticket.status = "Open";
    ticket.reopened = true;
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;
    ticket.closedAt = null;

    await ticket.save();

    if (global.io) {
      global.io.emit("ticketReopened", {
        ticketId: ticket._id,
        title: ticket.title,
      });
    }

    return res.json({
      success: true,
      message: "Ticket reopened successfully",
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

    if (ticket.status !== "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved tickets can be reviewed",
      });
    }

    if (ticket.review) {
      return res.status(400).json({
        success: false,
        message: "Review already submitted",
      });
    }

    ticket.review = review;
    ticket.rating = rating;

    await ticket.save();

    return res.json({
      success: true,
      message: "Review added successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ DELETE TICKET
====================================================== */
export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};