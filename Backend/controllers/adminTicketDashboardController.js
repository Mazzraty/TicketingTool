import Ticket from "../models/ticketSchema.js";
import { getCompanyFilter } from "./dashboardController.js";
import { slaPolicy } from "../config/slaPolicy.js";

/* =========================
   HELPER: INCLUSIVE DATE RANGE
   `to` is a plain "YYYY-MM-DD" string from the frontend, which
   `new Date(to)` parses as midnight UTC. Without this, tickets
   created later in the "to" day (e.g. this afternoon, when "today"
   is selected) get excluded by $lte. Push the end boundary to the
   last millisecond of that day so the whole day is included.
========================= */
const buildDateRangeFilter = (from, to) => {
  if (!from || !to) return null;
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return { $gte: new Date(from), $lte: end };
};

export const getSlaPolicy = async (req, res) => {
  res.json(slaPolicy);
};
export const getTicketKpis = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);
    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      slaBreached,
    ] = await Promise.all([
      Ticket.countDocuments(filter),
      Ticket.countDocuments({ ...filter, status: "Open" }),
      Ticket.countDocuments({ ...filter, status: "In Progress" }),
      Ticket.countDocuments({ ...filter, status: "Resolved" }),
      Ticket.countDocuments({ ...filter, status: "Closed" }),
      Ticket.countDocuments({ ...filter, priority: "Critical" }),
      Ticket.countDocuments({
        ...filter,
        $or: [
          { "sla.firstResponseBreached": true },
          { "sla.resolutionBreached": true },
        ],
      }),
    ]);

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      slaBreached,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getTicketTrend = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    const trend = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          tickets: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json(trend);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


export const getTicketStatusChart = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const getTicketPriorityChart = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$priority",
          value: { $sum: 1 },
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const getDepartmentChart = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$department",
          value: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          value: -1,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getTicketCategoryChart = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    // Ticket schema has no `category` field — this chart now groups by
    // `relatedTo` instead (Laptop/Desktop, ERP, Email, Printer, etc.),
    // which is what "By Category" is meant to represent on the dashboard.
    // Tickets with no relatedTo set fall back to "Others" so the chart
    // still adds up to 100%.
    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $ifNull: ["$relatedTo", "Others"] },
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          value: -1,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAvgResolutionTime = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);
    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = buildDateRangeFilter(from, to);
    }

    // Only tickets that actually have a resolution timestamp count
    // toward the average. Adjust `resolvedAt` below if your schema
    // uses a different field name (e.g. closedAt, resolvedOn).
    filter.resolvedAt = { $exists: true, $ne: null };

    const result = await Ticket.aggregate([
      { $match: filter },
      {
        $project: {
          resolutionMs: { $subtract: ["$resolvedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: "$resolutionMs" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      avgResolutionMs: result[0]?.avgResolutionMs || 0,
      count: result[0]?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};