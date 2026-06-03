import Ticket from "../models/ticketSchema.js";
import User from "../models/userShema.js";
import sendEmail from "../utils/sendEmail.js";
import { ticketAdminEmail } from "../utils/ticketAdminEmail.js";
import { ticketUserEmail } from "../utils/ticketUserEmail.js";
import notifcationSchema from "../models/notifcationSchema.js";
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
      slaDue: new Date(
        Date.now() + (slaHours[priority] || 72) * 3600000
      ),
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

    if (global.io) {
      global.io.emit("newTicket", ticket);
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (err) {
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

    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ✅ UPDATE STATUS (ADMIN)
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

    if (status === "In Progress") ticket.inProgressAt = new Date();
    if (status === "Resolved") ticket.resolvedAt = new Date();
    if (status === "Closed") ticket.closedAt = new Date();

    if (status === "Open") {
      ticket.reopened = true;
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();
    await Notification.create({
      userId: ticket.userId,
      title: "Ticket Status Updated",
      message: `Your ticket "${ticket.title}" is now ${status}`,
      type: "status",
    });
    res.json({
      success: true,
      message: "Status updated",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

    const { title, description, department, priority } = req.body;

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (department) ticket.department = department;
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

    if (ticket.status !== "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved tickets can be reviewed",
      });
    }

    // ✅ ALLOW CREATE OR UPDATE (FIX)
    ticket.review = review;
    ticket.rating = rating;
    ticket.reviewedAt = new Date(); // optional tracking

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
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: "Open" });
    const inProgress = await Ticket.countDocuments({ status: "In Progress" });
    const resolved = await Ticket.countDocuments({ status: "Resolved" });
    const closed = await Ticket.countDocuments({ status: "Closed" });

    res.json({
      success: true,
      data: { total, open, inProgress, resolved, closed },
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
      message: "Ticket deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};