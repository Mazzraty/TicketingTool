import Ticket from "../models/ticketSchema.js";
import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";

export const searchAll = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const userId = req.query.userId; // ← present for user role
    const isUser = !!userId;

    if (!q) {
      return res.json({ tickets: [], assets: [], employees: [] });
    }

    const regex = new RegExp(q, "i");
    const companyFilter = req.user.role === "super_admin"
      ? req.user.companyId || req.query.companyId
        ? { companyId: req.user.companyId || req.query.companyId }
        : {}
      : req.user.role === "it_support"
        ? { companyId: req.user.companyId || null }
        : {};

    // ← user: only their tickets, no assets/employees
    if (isUser) {
      const tickets = await Ticket.find({
        title: regex,
        createdBy: userId, // ← only their tickets
      })
        .limit(5)
        .select("title status ticketId");

      return res.json({ tickets, assets: [], employees: [] });
    }

    // ← admin: search everything
    const [tickets, assets, employees] = await Promise.all([
      Ticket.find({ title: regex, ...companyFilter })
        .limit(5)
        .select("title status ticketId"),

      Asset.find({
        ...companyFilter,
        $or: [
          { assetCode: regex },
          { type: regex },
          { model: regex },
        ],
      })
        .limit(5)
        .select("assetCode type model"),

      EmployeeMaster.find({
        ...companyFilter,
        $or: [
          { name: regex },
          { staffCode: regex },
          { department: regex },
        ],
      })
        .limit(5)
        .select("name staffCode department"),
    ]);

    res.json({ tickets, assets, employees });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};