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

      // tracking fields
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
// ✅ GET SINGLE TICKET (IMPORTANT FOR EDIT)
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
// ✅ USER TICKETS
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
// ✅ ADMIN ALL TICKETS
// ======================================================
export const getAllTickets = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const query = {};

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
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
// ✅ GET STATS
// ======================================================
export const getTicketStats = async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: "Open" });
    const inProgress = await Ticket.countDocuments({ status: "In Progress" });
    const resolved = await Ticket.countDocuments({ status: "Resolved" });
    const closed = await Ticket.countDocuments({ status: "Closed" });

    res.json({ total, open, inProgress, resolved, closed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======================================================
// ✅ UPDATE STATUS (ADMIN)
// ======================================================
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;

    // RESOLVED
    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
    }

    // REOPEN
    if (status === "Open") {
      ticket.reopened = true;
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;

      // reset feedback
      ticket.review = "";
      ticket.rating = 0;
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Status updated",
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

    if (priority) {
      const slaHours = {
        Low: 72,
        Medium: 24,
        High: 8,
        Critical: 2,
      };

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
        message: "Review already submitted",
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