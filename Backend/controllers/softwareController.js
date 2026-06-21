import Software from "../models/softwareSchema.js";

/* ==============================
   HELPER: COMPANY FILTER
============================== */
const getCompanyFilter = (user) => {
  if (user.role === "super_admin") return {};
  return { companyId: user.companyId };
};

/* ==============================
   ➕ CREATE SOFTWARE
============================== */
export const createSoftware = async (req, res) => {
  try {
    const software = await Software.create({
      ...req.body,
      companyId: req.user.companyId,
    });

    res.status(201).json(software);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   📦 GET ALL SOFTWARES
   (PAGINATION + SEARCH + COMPANY SAFE)
============================== */
export const getSoftwares = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const query = {
      ...filter,
      ...(search && {
        $or: [
          { serviceName: { $regex: search, $options: "i" } },
          { vendor: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const softwares = await Software.find(query)
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Software.countDocuments(query);

    res.json({
      data: softwares,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   🔍 GET SINGLE SOFTWARE
============================== */
export const getSoftwareById = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const software = await Software.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!software) {
      return res.status(404).json({
        message: "Software not found",
      });
    }

    res.json(software);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   ✏️ UPDATE SOFTWARE
============================== */
export const updateSoftware = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const software = await Software.findOneAndUpdate(
      {
        _id: req.params.id,
        ...filter,
      },
      req.body,
      { new: true }
    );

    if (!software) {
      return res.status(404).json({
        message: "Software not found",
      });
    }

    res.json(software);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   🗑 DELETE SOFTWARE
============================== */
export const deleteSoftware = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const software = await Software.findOneAndDelete({
      _id: req.params.id,
      ...filter,
    });

    if (!software) {
      return res.status(404).json({
        message: "Software not found",
      });
    }

    res.json({
      message: "Software deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   📊 DASHBOARD STATS (COMPANY WISE)
============================== */
export const getDashboardStats = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

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
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost: totalCostAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};