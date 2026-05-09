import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import AssetAssignment from "../models/assignmentSchema.js";

/* =========================
   ➕ CREATE ASSET
========================= */
export const createAsset = async (req, res) => {
  try {
    const { assetCode, name, type, serialNumber } = req.body;

    if (!assetCode || !name) {
      return res.status(400).json({
        msg: "AssetCode and Name required",
      });
    }

    const exists = await Asset.findOne({ assetCode });

    if (exists) {
      return res.status(400).json({
        msg: "Asset already exists",
      });
    }

    const asset = await Asset.create({
      assetCode,
      name,
      type,
      serialNumber,
      status: "available",
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

    const assets = await Asset.find()
      .sort({ createdAt: -1 });

    res.json(assets);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   🔥 ASSIGN ASSET
========================= */
export const assignAsset = async (req, res) => {
  try {

    const { employeeId, assetCode } = req.body;

    console.log("ASSIGN PAYLOAD:", req.body);

    // FIND EMPLOYEE USING STAFF CODE
    const employee = await EmployeeMaster.findOne({
      staffCode: employeeId,
    });

    // FIND ASSET USING ASSET CODE
    const asset = await Asset.findOne({
      assetCode,
    });

    if (!employee) {
      return res.status(404).json({
        msg: "Employee not found",
      });
    }

    if (!asset) {
      return res.status(404).json({
        msg: "Asset not found",
      });
    }

    if (asset.status !== "available") {
      return res.status(400).json({
        msg: "Asset already assigned",
      });
    }

    // CREATE ASSIGNMENT
    const assignment = await AssetAssignment.create({
      employee: employee._id,
      asset: asset._id,
      status: "active",
      assignedDate: new Date(),
    });

    // UPDATE ASSET STATUS
    asset.status = "assigned";
    await asset.save();

    res.status(201).json({
      msg: "Asset assigned successfully",
      assignment,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   🔄 RETURN ASSET
========================= */
export const returnAsset = async (req, res) => {
  try {

    const { assetCode } = req.body;

    const asset = await Asset.findOne({
      assetCode,
    });

    if (!asset) {
      return res.status(404).json({
        msg: "Asset not found",
      });
    }

    const assignment = await AssetAssignment.findOne({
      asset: asset._id,
      status: "active",
    });

    if (!assignment) {
      return res.status(404).json({
        msg: "No active assignment",
      });
    }

    // CLOSE ASSIGNMENT
    assignment.status = "closed";
    assignment.returnedDate = new Date();

    await assignment.save();

    // UPDATE ASSET STATUS
    asset.status = "available";

    await asset.save();

    res.json({
      msg: "Asset returned successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   👨 EMPLOYEE HISTORY
========================= */
export const getEmployeeHistory = async (req, res) => {
  try {

    // FIND EMPLOYEE USING STAFF CODE
    const employee = await EmployeeMaster.findOne({
      staffCode: req.params.id,
    });

    if (!employee) {
      return res.status(404).json({
        msg: "Employee not found",
      });
    }

    const history = await AssetAssignment.find({
      employee: employee._id,
    })
      .populate("asset")
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   💻 ASSET HISTORY
========================= */
export const getAssetHistory = async (req, res) => {
  try {

    // FIND ASSET USING ASSET CODE
    const asset = await Asset.findOne({
      assetCode: req.params.code,
    });

    if (!asset) {
      return res.status(404).json({
        msg: "Asset not found",
      });
    }

    const history = await AssetAssignment.find({
      asset: asset._id,
    })
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};