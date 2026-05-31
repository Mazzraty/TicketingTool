import Asset from "../models/assetSchema.js";
import Ticket from "../models/ticketSchema.js";
import Employee from "../models/employeeMasterSchema.js";
import Software from "../models/softwareSchema.js";


/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    // ASSETS
    const totalAssets = await Asset.countDocuments();
    const laptops = await Asset.countDocuments({ type: "Laptop" });
    const printers = await Asset.countDocuments({ type: "Printer" });
    const hht = await Asset.countDocuments({ type: "HHT" });

    const assigned = await Asset.countDocuments({
      status: "assigned",
    });

    const available = await Asset.countDocuments({
      status: "available",
    });

    // EMPLOYEES
    const employees = await Employee.countDocuments();

    // TICKETS
    const openTickets = await Ticket.countDocuments({
      status: "Open",
    });

    // SOFTWARE
    const today = new Date();

    const startMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const endMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    const totalActiveLicenses =
      await Software.countDocuments({
        status: "Active",
      });

    const expiringThisMonth =
      await Software.countDocuments({
        expiryDate: {
          $gte: startMonth,
          $lte: endMonth,
        },
      });

    const expiredServices =
      await Software.countDocuments({
        expiryDate: {
          $lt: today,
        },
      });

    const totalCost = await Software.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      // Assets
      totalAssets,
      laptops,
      printers,
      hht,
      assigned,
      available,

      // Employees
      employees,

      // Tickets
      openTickets,

      // Software
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost:
        totalCost[0]?.total || 0,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Dashboard stats error",
    });
  }
};

/* ================= RECENT ASSETS ================= */
export const getRecentAssets = async (req, res) => {
  try {
    const assets = await Asset.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "Recent assets error" });
  }
};

/* ================= RECENT TICKETS ================= */
export const getRecentTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Recent tickets error" });
  }
};

export const getRecentSoftware = async (req, res) => {
  try {
    const software = await Software.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(software);
  } catch (err) {
    res.status(500).json({
      message: "Recent software error",
    });
  }
};