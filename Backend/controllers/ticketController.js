import Ticket from "../models/ticketSchema.js";
import User from "../models/userShema.js";
import { sendEmail } from "../utils/emailUtility.js";


// ==========================

// ==========================
// ✅ CREATE TICKET (PRO FIXED)
// ==========================
export const createTicket = async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;

    // VALIDATION
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title & Description required",
      });
    }

    // FILES
    const attachments =
      req.files?.map((f) => f.path || f.filename) || [];

    // SLA CALCULATION
    const slaHours = {
      Low: 72,
      Medium: 24,
      High: 8,
      Critical: 2,
    };

    const slaDue = new Date(
      Date.now() + (slaHours[priority] || 72) * 60 * 60 * 1000
    );

    // CREATE TICKET
    const ticket = await Ticket.create({
      title,
      description,
      department,
      priority,
      attachments,
      userId: req.user.id,
      slaDue,
    });

    // GET USER
    const user = await User.findById(req.user.id).select(
      "email name"
    );

    // ==========================
    // SOCKET NOTIFICATION (FAST)
    // ==========================
    if (global.io) {
      try {
        const admins = await User.find({ role: "admin" });

        admins.forEach((admin) => {
          global.io.to(admin._id.toString()).emit("newTicket", {
            message: "New ticket created",
            ticket,
            user: {
              name: user?.name,
              email: user?.email,
            },
          });
        });
      } catch (socketErr) {
        console.log("❌ Socket error:", socketErr.message);
      }
    }

    // ==========================
    // EMAIL (NON-BLOCKING SAFE)
    // ==========================
    const sendNotificationEmail = async () => {
      try {
        if (!process.env.ADMIN_EMAIL) {
          throw new Error("ADMIN_EMAIL missing in .env");
        }

        await sendEmail(
          process.env.ADMIN_EMAIL,
          "New Ticket Raised",
          {
            title,
            description,
            department,
            priority,
            status: "Open",
            userEmail: user?.email,
          }
        );

        console.log("📧 Email sent successfully");
      } catch (err) {
        console.log("❌ EMAIL FAILED:", err.message);
      }
    };

    // FIRE & FORGET EMAIL
    sendNotificationEmail();

    // ==========================
    // RESPONSE (IMMEDIATE)
    // ==========================
    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });

  } catch (error) {
    console.log("CREATE TICKET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ==========================
// ✅ USER TICKETS
// ==========================
export const getUserTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalTickets = await Ticket.countDocuments({
      userId: req.user.id,
    });

    const tickets = await Ticket.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalTickets / limit);

    res.json({
      success: true,
      data: tickets,
      totalPages,
      currentPage: page,
      totalTickets,
    });

  } catch (error) {
    console.log("USER TICKETS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ==========================
// ✅ ADMIN - ALL TICKETS
// ==========================
export const getAllTickets = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const {
      status,
      priority,
      department,
      search,
      sort = "latest",
      startDate,
      endDate,
    } = req.query;

    // 🔍 Build query
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (department) query.department = department;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 🔎 Search (title + description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 📊 Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "priority") sortOption = { priority: -1 };

    // 🚀 Query execution
    const tickets = await Ticket.find(query)
      .populate("userId", "name email")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: tickets.length,
      data: tickets,
    });

  } catch (err) {
    console.error("ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ==========================
// ✅ UPDATE STATUS
// ==========================
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: "Status updated",
      data: ticket,
    });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTicketStats = async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: "Open" });
    const inProgress = await Ticket.countDocuments({ status: "In Progress" });
    const resolved = await Ticket.countDocuments({ status: "Resolved" });
    const closed = await Ticket.countDocuments({ status: "Closed" });

    res.json({
      total,
      open,
      inProgress,
      resolved,
      closed,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// ✅ DELETE TICKET (OPTIONAL)
// ==========================
export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ticket deleted",
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};