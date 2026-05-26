import Asset from "../models/assetSchema.js";
import Ticket from "../models/ticketSchema.js";
import Employee from "../models/employeeMasterSchema.js";

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();

    const laptops = await Asset.countDocuments({ type: "Laptop" });
    const printers = await Asset.countDocuments({ type: "Printer" });
    const hht = await Asset.countDocuments({ type: "HHT" });

    const assigned = await Asset.countDocuments({ status: "assigned" });
    const available = await Asset.countDocuments({ status: "available" });

    const employees = await Employee.countDocuments();

   import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();

    const laptops = await Asset.countDocuments({ type: "Laptop" });
    const printers = await Asset.countDocuments({ type: "Printer" });
    const hht = await Asset.countDocuments({ type: "HHT" });

    const assigned = await Asset.countDocuments({ status: "assigned" });
    const available = await Asset.countDocuments({ status: "available" });

    const employees = await Employee.countDocuments();

    // ✅ FIX: correct open ticket count
    const openTickets = await Ticket.countDocuments({
      status: "Open",
    });

    res.json({
      totalAssets,
      laptops,
      printers,
      hht,
      assigned,
      available,
      employees,
      openTickets, // ✅ IMPORTANT FIX
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard stats error" });
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