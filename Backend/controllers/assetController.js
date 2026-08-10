import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import AssetAssignment from "../models/assignmentSchema.js";

/* =========================
   HELPER: COMPANY FILTER
========================= */
const getCompanyFilter = (user) => {
  if (user.role === "super_admin") return {};
  return { companyId: user.companyId };
};

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
      route,
      salesmanCode,
      salesmanName,
      supervisor,
      soti,
      imei,
      simNumber,
      notes,
      companyId, // <-- NEW
    } = req.body;

    if (!assetCode) {
      return res.status(400).json({
        msg: "Asset Code required",
      });
    }

    // SUPER ADMIN MUST SELECT COMPANY
    const selectedCompanyId =
      req.user.role === "super_admin"
        ? companyId
        : req.user.companyId;

    if (!selectedCompanyId) {
      return res.status(400).json({
        msg: "Company is required",
      });
    }

    const exists = await Asset.findOne({
      assetCode,
      companyId: selectedCompanyId,
    });

    if (exists) {
      return res.status(400).json({
        msg: "Asset already exists",
      });
    }

    if (type === "Printer" && !route) {
      return res.status(400).json({
        msg: "Printer requires route",
      });
    }

    if (type === "HHT") {
      if (!imei) {
        return res.status(400).json({
          msg: "HHT requires IMEI",
        });
      }
      if (!model || !serialNumber) {
        return res.status(400).json({
          msg: "HHT requires model and serial number",
        });
      }
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

      companyId: selectedCompanyId, // <-- IMPORTANT
    });

    res.status(201).json(asset);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};
/* =========================
   📦 GET ALL ASSETS
========================= */
export const getAssets = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Asset.countDocuments(filter);

    const assets = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const assetIds = assets.map((a) => a._id);

    const assignments = await AssetAssignment.find({
      asset: { $in: assetIds },
      status: "active",
      ...filter,
    }).populate("employee", "name staffCode");

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

    const filter = getCompanyFilter(req.user);

    const employee = await EmployeeMaster.findOne({
      staffCode: employeeId,
      ...filter,
    });

    const asset = await Asset.findOne({
      assetCode,
      ...filter,
    });

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

      companyId:
        asset.companyId ||
        employee.companyId ||
        req.user.companyId,
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

    const filter = getCompanyFilter(req.user);

    const asset = await Asset.findOne({
      assetCode,
      ...filter,
    });

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    const assignment = await AssetAssignment.findOne({
      asset: asset._id,
      status: "active",
      ...filter,
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
   ✏️ UPDATE ASSET
========================= */
export const updateAsset = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const asset = await Asset.findOne({
      _id: req.params.id,
      ...filter,
    });

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
      "status",
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
    const filter = getCompanyFilter(req.user);

    const asset = await Asset.findOneAndDelete({
      _id: req.params.id,
      ...filter,
    });

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

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
    const filter = getCompanyFilter(req.user);

    const employee = await EmployeeMaster.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    const history = await AssetAssignment.find({
      employee: employee._id,
      ...filter,
    })
      .populate("asset")
      .sort({ createdAt: -1 });

    res.json(history);
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
    const filter = getCompanyFilter(req.user);

    let asset = await Asset.findOne({
      assetCode: req.params.code,
      ...filter,
    });

    if (!asset) {
      asset = await Asset.findById(req.params.code);
    }

    if (!asset) {
      return res.status(404).json({ msg: "Asset not found" });
    }

    const history = await AssetAssignment.find({
      asset: asset._id,
      ...filter,
    })
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   👤 MY ASSETS
========================= */
export const getMyAssets = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const employee = await EmployeeMaster.findOne({
      staffCode: req.user.staffCode,
      ...filter,
    });

    if (!employee) {
      return res.status(404).json({
        msg: "Employee record not found",
      });
    }

    const assets = await AssetAssignment.find({
      employee: employee._id,
      status: "active",
      ...filter,
    })
      .populate("asset")
      .sort({ assignedDate: -1 });

    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   📅 UPDATE ASSIGNMENT DATE
========================= */
export const updateAssignmentDate = async (req, res) => {
  try {
    const { assignedDate } = req.body;

    if (!assignedDate) {
      return res.status(400).json({ msg: "assignedDate is required" });
    }

    const filter = getCompanyFilter(req.user);

    const assignment = await AssetAssignment.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }

    assignment.assignedDate = new Date(assignedDate);
    await assignment.save();

    res.json({
      msg: "Assigned date updated successfully",
      assignment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};