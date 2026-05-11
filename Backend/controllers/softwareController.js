// controllers/softwareController.js

import Software from "../models/softwareSchema.js";

/* ==============================
   CREATE SOFTWARE
================================ */
export const createSoftware = async (req, res) => {
  try {
    const software = await Software.create(req.body);

    res.status(201).json(software);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==============================
   GET ALL SOFTWARES (PAGINATION + SEARCH ADDED)
================================ */
export const getSoftwares = async (req, res) => {
  try {
    // ✅ pagination + search
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // ✅ search filter (safe, does not break logic)
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { vendor: { $regex: search, $options: "i" } },
            { licenseKey: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const softwares = await Software.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Software.countDocuments(filter);

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
   GET SINGLE SOFTWARE
================================ */
export const getSoftwareById = async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);

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
   UPDATE SOFTWARE
================================ */
export const updateSoftware = async (req, res) => {
  try {
    const software = await Software.findByIdAndUpdate(
      req.params.id,
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
   DELETE SOFTWARE
================================ */
export const deleteSoftware = async (req, res) => {
  try {
    const software = await Software.findByIdAndDelete(req.params.id);

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
   DASHBOARD STATS
================================ */
export const getDashboardStats = async (req, res) => {
  try {
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
      status: "Active",
    });

    const expiringThisMonth = await Software.countDocuments({
      expiryDate: {
        $gte: startMonth,
        $lte: endMonth,
      },
    });

    const expiredServices = await Software.countDocuments({
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
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost: totalCost[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};