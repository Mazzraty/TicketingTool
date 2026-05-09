import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import AssetAssignment from "../models/assignmentSchema.js";

/* =========================
   ➕ CREATE ASSET
========================= */
export const createAsset = async (req, res) => {
  try {
    const { assetCode, name, type, serialNumber } = req.body;

    if (!assetCode || !name)
      return res.status(400).json({ msg: "AssetCode and Name required" });

    const exists = await Asset.findOne({ assetCode });
    if (exists)
      return res.status(400).json({ msg: "Asset already exists" });

    const asset = await Asset.create({
      assetCode,
      name,
      type,
      serialNumber,
      status: "available",
    });

    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   📦 GET ALL ASSETS
========================= */
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   🔥 ASSIGN ASSET
========================= */
export const assignAsset = async (req, res) => {
  try {
    const { employeeId, assetCode } = req.body;

    const employee = await EmployeeMaster.findOne({ employeeId });
    const asset = await Asset.findOne({ assetCode });

    if (!employee)
      return res.status(404).json({ msg: "Employee not found" });

    if (!asset)
      return res.status(404).json({ msg: "Asset not found" });

    if (asset.status !== "available")
      return res.status(400).json({ msg: "Asset already assigned" });

    const assignment = await AssetAssignment.create({
      employee: employee._id,
      asset: asset._id,
      status: "active",
      assignedDate: new Date(),
    });

    asset.status = "assigned";
    await asset.save();

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   🔄 RETURN ASSET
========================= */
export const returnAsset = async (req, res) => {
  try {
    const { assetCode } = req.body;

    const asset = await Asset.findOne({ assetCode });

    if (!asset)
      return res.status(404).json({ msg: "Asset not found" });

    const assignment = await AssetAssignment.findOne({
      asset: asset._id,
      status: "active",
    });

    if (!assignment)
      return res.status(404).json({ msg: "No active assignment" });

    assignment.status = "closed";
    assignment.returnedDate = new Date();
    await assignment.save();

    asset.status = "available";
    await asset.save();

    res.json({ msg: "Asset returned successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   👨 EMPLOYEE HISTORY
========================= */
export const getEmployeeHistory = async (req, res) => {
  try {
    const employee = await EmployeeMaster.findOne({
      employeeId: req.params.id,
    });

    if (!employee)
      return res.status(404).json({ msg: "Employee not found" });

    const history = await AssetAssignment.find({
      employee: employee._id,
    })
      .populate("asset")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   💻 ASSET HISTORY
========================= */
export const getAssetHistory = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      assetCode: req.params.code,
    });

    if (!asset)
      return res.status(404).json({ msg: "Asset not found" });

    const history = await AssetAssignment.find({
      asset: asset._id,
    })
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


