import Asset from "../models/assetSchema.js";
import Ticket from "../models/ticketSchema.js";
import Employee from "../models/employeeMasterSchema.js";
import Software from "../models/softwareSchema.js";

/* =========================
   HELPER: COMPANY FILTER
   - super_admin: sees all companies by default,
     or a single company when companyId is passed in the query
   - other roles: always locked to their own companyId or active access company
========================= */
export const getCompanyFilter = (user, query = {}) => {
  if (user.role === "super_admin") {
    return query.companyId ? { companyId: query.companyId } : {};
  }

  if (user.companyId) {
    return { companyId: user.companyId };
  }

  const activeCompany = user.companyAccess?.find(
    (c) => c.isActive && c.companyId
  )?.companyId;

  return activeCompany ? { companyId: activeCompany } : {};
};

/* =========================
   DASHBOARD STATS (COMPANY WISE)
========================= */
export const getDashboardStats = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const totalAssets = await Asset.countDocuments(filter);

    const laptops = await Asset.countDocuments({
      ...filter,
      type: "Laptop",
    });

    const printers = await Asset.countDocuments({
      ...filter,
      type: "Printer",
    });

    const hht = await Asset.countDocuments({
      ...filter,
      type: "HHT",
    });

    const available = await Asset.countDocuments({
      ...filter,
      status: "available",
    });

    const assigned = await Asset.countDocuments({
      ...filter,
      status: "assigned",
    });

    const damaged = await Asset.countDocuments({
      ...filter,
      status: "damaged",
    });

    const printerForService = await Asset.countDocuments({
      ...filter,
      status: "printer_for_service",
    });

    const underService = await Asset.countDocuments({
      ...filter,
      status: "under_service",
    });

    const employees = await Employee.countDocuments(filter);

    const openTickets = await Ticket.countDocuments({
      ...filter,
      status: "Open",
    });

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

    const totalActiveLicenses = await Software.countDocuments({
      ...filter,
      status: "Active",
    });

    const expiringThisMonth = await Software.countDocuments({
      ...filter,
      expiryDate: {
        $gte: startMonth,
        $lte: endMonth,
      },
    });

    const expiredServices = await Software.countDocuments({
      ...filter,
      expiryDate: { $lt: today },
    });

    const totalCostAgg = await Software.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      totalAssets,
      laptops,
      printers,
      hht,

      available,
      assigned,
      damaged,
      printerForService,
      underService,

      employees,
      openTickets,
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost: totalCostAgg[0]?.total || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Dashboard stats error",
    });
  }
};
/* =========================
   RECENT ASSETS
========================= */
export const getRecentAssets = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const assets = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "Recent assets error" });
  }
};

/* =========================
   RECENT TICKETS
========================= */
export const getRecentTickets = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Recent tickets error" });
  }
};

/* =========================
   RECENT SOFTWARE
========================= */
export const getRecentSoftware = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const software = await Software.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(software);
  } catch (err) {
    res.status(500).json({
      message: "Recent software error",
    });
  }
};