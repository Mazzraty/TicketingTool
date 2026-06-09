import Ticket from "../models/ticketSchema.js";
import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";

export const searchAll = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.json({ tickets: [], assets: [], employees: [] });
    }

    const regex = new RegExp(q, "i");

    const [tickets, assets, employees] = await Promise.all([
      Ticket.find({ title: regex })
        .limit(5)
        .select("title status ticketId"),

      Asset.find({
        $or: [
          { assetCode: regex },
          { type: regex },
          { model: regex },
        ],
      })
        .limit(5)
        .select("assetCode type model"),

      EmployeeMaster.find({
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