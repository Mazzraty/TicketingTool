import Asset from "../models/assetSchema.js";
import Employee from "../models/employeeMasterSchema.js";
import Ticket from "../models/ticketSchema.js";

export const getDashboardStats = async (req, res) => {
  try {
    // ================= ASSETS =================
    const totalAssets = await Asset.countDocuments();

    const laptops = await Asset.countDocuments({ type: "Laptop" });
    const printers = await Asset.countDocuments({ type: "Printer" });
    const hht = await Asset.countDocuments({ type: "HHT" });

    const assigned = await Asset.countDocuments({ status: "assigned" });
    const available = await Asset.countDocuments({ status: "available" });

    // ================= EMPLOYEES =================
    const employees = await Employee.countDocuments();

    // ================= TICKETS =================
    const openTickets = await Ticket.countDocuments({
      status: "open",
    });

    // ================= RESPONSE =================
    res.status(200).json({
      totalAssets,
      laptops,
      printers,
      hht,
      assigned,
      available,
      employees,
      openTickets,
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({
      message: "Failed to load dashboard stats",
    });
  }
};