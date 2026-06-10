import Company from "../models/comapnySchema.js";

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).select(
      "name code description location"
    );

    res.json({ success: true, companies });
  } catch (err) {
    console.error("GET COMPANIES ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, code, description, location, settings } = req.body;

    const trimmedCode = code?.trim().toUpperCase();
    if (!name || !trimmedCode) {
      return res.status(400).json({ message: "Company name and code are required" });
    }

    const existing = await Company.findOne({ code: trimmedCode });
    if (existing) {
      return res.status(400).json({ message: "Company code already exists" });
    }

    const company = await Company.create({
      name: name.trim(),
      code: trimmedCode,
      description: description || "",
      location: location || {},
      settings: settings || {},
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, company });
  } catch (err) {
    console.error("CREATE COMPANY ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
