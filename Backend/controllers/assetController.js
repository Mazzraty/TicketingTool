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

      // Printer / HHT
      route,
      salesmanCode,
      salesmanName,
      supervisor,
      soti,
      imei,
      simNumber,
      notes,
    } = req.body;

    if (!assetCode) {
      return res.status(400).json({
        msg: "Asset Code required",
      });
    }

    const exists = await Asset.findOne({
      assetCode,
    });

    if (exists) {
      return res.status(400).json({
        msg: "Asset already exists",
      });
    }

    const asset = await Asset.create({
      assetCode,

      type: type || "Laptop",

      model,
      serialNumber,

      status: "available",

      // Printer / HHT Fields
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

    const filter = {};

    // FILTER BY TYPE
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // FILTER BY STATUS
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const assets = await Asset.find(filter)
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

    const {
      employeeId,
      assetCode,
      remarks,
    } = req.body;

    console.log("ASSIGN PAYLOAD:", req.body);

    // FIND EMPLOYEE
    const employee = await EmployeeMaster.findOne({
      staffCode: employeeId,
    });

    // FIND ASSET
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

    // CREATE HISTORY ASSIGNMENT
    const assignment = await AssetAssignment.create({
      employee: employee._id,

      asset: asset._id,

      assignedDate: new Date(),

      status: "active",

      // SNAPSHOT
      assetType: asset.type,

      assetCode: asset.assetCode,

      model: asset.model,

      salesmanCode: asset.salesmanCode,

      salesmanName: asset.salesmanName,

      route: asset.route,

      supervisor: asset.supervisor,

      assignedBy: req.user?.name || "Admin",

      remarks,
    });

    // UPDATE STATUS
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

    const {
      assetCode,
      remarks,
    } = req.body;

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

    assignment.returnedBy =
      req.user?.name || "Admin";

    assignment.remarks = remarks;

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
   ✏️ UPDATE ASSET
========================= */
export const updateAsset = async (req, res) => {
  try {

    const asset = await Asset.findById(
      req.params.id
    );

    if (!asset) {
      return res.status(404).json({
        msg: "Asset not found",
      });
    }

    Object.assign(asset, req.body);

    await asset.save();

    res.json({
      msg: "Asset updated successfully",
      asset,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   🗑 DELETE ASSET
========================= */
export const deleteAsset = async (req, res) => {
  try {

    const asset = await Asset.findById(
      req.params.id
    );

    if (!asset) {
      return res.status(404).json({
        msg: "Asset not found",
      });
    }

    await asset.deleteOne();

    res.json({
      msg: "Asset deleted successfully",
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

/* =========================
   🖨 GET PRINTERS ONLY
========================= */
export const getPrinters = async (req, res) => {
  try {

    const printers = await Asset.find({
      type: "Printer",
    }).sort({ createdAt: -1 });

    res.json(printers);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   📱 GET HHT ONLY
========================= */
export const getHHT = async (req, res) => {
  try {

    const hht = await Asset.find({
      type: "HHT",
    }).sort({ createdAt: -1 });

    res.json(hht);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      msg: err.message,
    });
  }
};