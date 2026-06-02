import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import AssetAssignment from "../models/assignmentSchema.js";

/* =========================
   ➕ CREATE ASSET
========================= */
export const createAsset = async (req, res) => {
  try {
    const {
      assetCode,
      type,
      model,
      serialNumber,

      // Printer fields
      route,
      salesmanCode,
      salesmanName,
      supervisor,
      soti,

      // HHT fields
      imei,
      simNumber,

      notes,
    } = req.body;

    if (!assetCode) {
      return res.status(400).json({ msg: "Asset Code required" });
    }

    const exists = await Asset.findOne({ assetCode });

    if (exists) {
      return res.status(400).json({ msg: "Asset already exists" });
    }

    // BASIC VALIDATION (ERP RULES)
    if (type === "Printer" && !route) {
      return res.status(400).json({ msg: "Printer requires route" });
    }

    if (type === "HHT" && !imei) {
      return res.status(400).json({ msg: "HHT requires IMEI" });
    }

    const asset = await Asset.create({
      assetCode,
      type: type || "Laptop",
      model,
      serialNumber,
      status: "available",

      route,
      salesmanCode,
      salesmanName,
      supervisor,
      soti,

      imei,
      simNumber,
      notes,
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   📦 GET ALL ASSETS
========================= */
export const getAssets = async (req, res) => {
  try {
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    // 🔥 pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Asset.countDocuments(filter);

    // 🔥 fetch only current page assets
    const assets = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 🔥 only get assignments for THESE assets (important optimization)
    const assetIds = assets.map((a) => a._id);

    const assignments = await AssetAssignment.find({
      asset: { $in: assetIds },
      status: "active",
    }).populate("employee", "name employeeName staffCode");

    const map = new Map();

    assignments.forEach((a) => {
      map.set(a.asset.toString(), a.employee);
    });

    const enriched = assets.map((asset) => ({
      ...asset.toObject(),
      employee: map.get(asset._id.toString()) || null,
    }));

    res.json({
      assets: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};
/* =========================
   🔥 ASSIGN ASSET
========================= */
export const assignAsset = async (req, res) => {
  try {
    const { employeeId, assetCode, remarks } = req.body;

    const employee = await EmployeeMaster.findOne({
      staffCode: employeeId,
    });

    const asset = await Asset.findOne({ assetCode });

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    if (asset.status !== "available") {
      return res.status(400).json({ msg: "Asset already assigned" });
    }

    const assignment = await AssetAssignment.create({
      employee: employee._id,
      asset: asset._id,
      assignedDate: new Date(),
      status: "active",

      // snapshot
      assetType: asset.type,
      assetCode: asset.assetCode,
      model: asset.model,

      route: asset.route,
      salesmanCode: asset.salesmanCode,
      salesmanName: asset.salesmanName,
      supervisor: asset.supervisor,

      imei: asset.imei,
      simNumber: asset.simNumber,

      assignedBy: req.user?.name || "Admin",
      remarks,
    });

    asset.status = "assigned";
    await asset.save();

    res.status(201).json({
      msg: "Asset assigned successfully",
      assignment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   🔄 RETURN ASSET
========================= */
export const returnAsset = async (req, res) => {
  try {
    const { assetCode, remarks } = req.body;

    const asset = await Asset.findOne({ assetCode });

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    const assignment = await AssetAssignment.findOne({
      asset: asset._id,
      status: "active",
    });

    if (!assignment) {
      return res.status(404).json({ msg: "No active assignment" });
    }

    assignment.status = "closed";
    assignment.returnedDate = new Date();
    assignment.returnedBy = req.user?.name || "Admin";
    assignment.remarks = remarks;

    await assignment.save();

    asset.status = "available";
    await asset.save();

    res.json({ msg: "Asset returned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   ✏️ UPDATE ASSET (SAFE)
========================= */
export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

  const allowedFields = [
  "assetCode",
  "type",
  "model",
  "serialNumber",
  "route",
  "salesmanCode",
  "salesmanName",
  "supervisor",
  "soti",
  "imei",
  "simNumber",
  "notes",
  "status", // ADD THIS
];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    });

    await asset.save();

    res.json({
      msg: "Asset updated successfully",
      asset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   🗑 DELETE ASSET
========================= */
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    await asset.deleteOne();

    res.json({ msg: "Asset deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   👨 EMPLOYEE HISTORY
========================= */
export const getEmployeeHistory = async (req, res) => {
  try {
    const employee = await EmployeeMaster.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    const history = await AssetAssignment.find({
      employee: employee._id,
    })
      .populate("asset")
      .sort({ createdAt: -1 });

    return res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   💻 ASSET HISTORY
========================= */
export const getAssetHistory = async (req, res) => {
  try {
    const { code } = req.params;

    let asset;

    // try assetCode first
    asset = await Asset.findOne({ assetCode: code });

    // fallback to Mongo ID
    if (!asset) {
      asset = await Asset.findById(code);
    }

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    const history = await AssetAssignment.find({
      asset: asset._id,
    })
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

//User Asset History


export const getMyAssets = async (req, res) => {
  try {
    console.log("USER =>", req.user);

    const employee = await EmployeeMaster.findOne({
      staffCode: req.user.employeeId,
    });

    console.log("EMPLOYEE =>", employee);

    if (!employee) {
      return res.status(404).json({
        msg: "Employee record not found",
      });
    }

    const assets = await AssetAssignment.find({
      employee: employee._id,
      status: "active",
    })
      .populate("asset")
      .sort({ assignedDate: -1 });

    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};