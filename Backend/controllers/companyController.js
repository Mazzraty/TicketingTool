// controllers/companyController.js
import Company from "../models/comapnySchema.js";

const noStore = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

// copies only listed keys, and only if the value has the expected type
const pick = (src, spec) => {
  if (!src || typeof src !== "object") return {};
  const out = {};
  for (const [key, type] of Object.entries(spec)) {
    if (typeof src[key] === type) {
      out[key] = type === "string" ? src[key].trim().slice(0, 200) : src[key];
    }
  }
  return out;
};

// PUBLIC: no auth, so expose the minimum. Never return `code` here if
// it is used for joining or inviting.
export const getPublicCompanies = async (req, res) => {
  try {
    noStore(res);
    const companies = await Company.find({ isActive: true })
      .select("name")
      .sort("name")
      .lean();
    return res.json({ success: true, companies });
  } catch (err) {
    console.error("GET PUBLIC COMPANIES ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// AUTHENTICATED: scoped by role
export const getCompanies = async (req, res) => {
  try {
    noStore(res);
    const { role, companyId, companyAccess = [] } = req.user;

    let filter;
    if (role === "super_admin") {
      filter = {};
    } else if (role === "it_support") {
      const ids = companyAccess
        .filter((c) => c.companyId && !c.revokedAt)
        .map((c) => c.companyId);
      filter = { _id: { $in: ids } };
    } else {
      if (!companyId) return res.json({ success: true, companies: [] });
      filter = { _id: companyId };
    }

    const companies = await Company.find(filter)
      .select("name code description location isActive")
      .lean();
    return res.json({ success: true, companies });
  } catch (err) {
    console.error("GET COMPANIES ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, code, description, location, settings } = req.body;

    if (typeof name !== "string" || typeof code !== "string") {
      return res.status(400).json({ message: "Company name and code are required" });
    }
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) {
      return res.status(400).json({ message: "Company name and code are required" });
    }
    if (trimmedName.length > 100 || trimmedCode.length > 20) {
      return res.status(400).json({ message: "Name or code is too long" });
    }

    const company = await Company.create({
      name: trimmedName,
      code: trimmedCode,
      description: typeof description === "string" ? description.trim().slice(0, 500) : "",
      location: pick(location, { country: "string", city: "string", address: "string" }),
      settings: pick(settings, {
        allowMultiBranch: "boolean",
        ticketAutoAssign: "boolean",
        assetTrackingEnabled: "boolean",
      }),
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, company });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Company code already exists" });
    }
    console.error("CREATE COMPANY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};