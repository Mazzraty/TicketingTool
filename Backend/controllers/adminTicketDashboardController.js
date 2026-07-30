import Ticket from "../models/ticketSchema.js";
import { getCompanyFilter } from "./dashboardController.js";

export const getTicketTrend = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const { from, to } = req.query;

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
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
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
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
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
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
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
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
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
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