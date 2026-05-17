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
    const getAdminRecipients = async () => {
      const admins = await User.find({ role: "admin" }).select("email");
      const emails = admins
        .map((admin) => admin.email)
        .filter(Boolean);

      if (emails.length > 0) {
        return emails;
      }

      if (process.env.ADMIN_EMAIL) {
        return [process.env.ADMIN_EMAIL];
      }

      return [];
    };

    const sendNotificationEmail = async () => {
      try {
        const recipients = await getAdminRecipients();

        if (!recipients.length) {
          throw new Error("No admin email recipients configured");
        }

        await sendEmail(
          recipients,
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

        console.log("📧 Email sent successfully to:", recipients.join(", "));
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
// ✅ SEND TEST EMAIL
// ==========================
export const sendTestEmail = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("email");
    const recipients = admins.map((admin) => admin.email).filter(Boolean);

    if (!recipients.length && !process.env.ADMIN_EMAIL) {
      return res.status(500).json({
        success: false,
        message: "No admin recipient email configured",
      });
    }

    const toSend = recipients.length ? recipients : [process.env.ADMIN_EMAIL];

    await sendEmail(
      toSend,
      "HelpyFy Test Email",
      {
        title: "Deployment email test",
        description: "This is a live deployment email test.",
        department: "Support",
        priority: "Medium",
        status: "Test",
        userEmail: req.user?.email || "test@helpyfy.local",
      }
    );

    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${toSend.join(", ")}`,
    });
  } catch (error) {
    console.error("SEND TEST EMAIL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email",
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

    // 📅 Date filter
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // 🔎 Search
    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // 📊 Sorting
    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    if (sort === "priority") {
      sortOption = { priority: -1 };
    }

    // 📌 Total count
    const total = await Ticket.countDocuments(query);

    // 📌 Total pages
    const totalPages = Math.ceil(total / limit);

    // 🚀 Fetch tickets
    const tickets = await Ticket.find(query)
      .populate("userId", "name email")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    // ✅ RESPONSE
    res.json({
      success: true,

      // OLD FORMAT
      total,
      page,
      pages: totalPages,

      // NEW FORMAT
      pagination: {
        totalTickets: total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },

      count: tickets.length,
      data: tickets,
    });

  } catch (err) {
    console.error("ADMIN ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
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