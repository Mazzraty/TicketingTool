import Company from "../models/comapnySchema.js";

export const getCompanies = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const companies = await Company.find({}).select(
      "name code description location"
    );

    return res.status(200).json({
      success: true,
      companies
    });

  } catch (err) {
    console.error("GET COMPANIES ERROR:", err);
    return res.status(500).json({ message: err.message });
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

export const getUsersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { role } = req.user;

    // 🔵 SUPER ADMIN → SEE EVERYTHING
    if (role === "super_admin") {
      const users = await User.find().lean();
      return res.json({ success: true, users });
    }

    // 🟡 IT SUPPORT → ONLY COMPANY DATA
    if (role === "it_support") {
      const users = await User.find({
        "companyAccess.companyId": companyId,
      }).lean();

      const filtered = users.map((user) => {
        const access = user.companyAccess.find(
          (c) => c.companyId.toString() === companyId
        );

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          staffCode: user.staffCode,
          role: access?.role,
          department: access?.department,
          position: access?.position,
        };
      });

      return res.json({ success: true, users: filtered });
    }

    return res.status(403).json({ message: "Access denied" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};