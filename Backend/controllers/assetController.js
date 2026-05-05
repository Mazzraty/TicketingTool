import Asset from "../models/assetSchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import AssetAssignment from "../models/assignmentSchema.js";

export const assignAsset = async (req, res) => {
  const { employeeId, assetCode } = req.body;

  const employee = await EmployeeMaster.findOne({ employeeId });
  const asset = await Asset.findOne({ assetCode });

  if (!employee) return res.status(404).json({ msg: "Employee not found" });
  if (!asset || asset.status !== "available")
    return res.status(400).json({ msg: "Asset not available" });

  const assignment = await AssetAssignment.create({
    employee: employee._id,
    asset: asset._id
  });

  asset.status = "assigned";
  await asset.save();

  res.json(assignment);
};


export const returnAsset = async (req, res) => {
  const { assetCode } = req.body;

  const asset = await Asset.findOne({ assetCode });

  const assignment = await AssetAssignment.findOne({
    asset: asset._id,
    status: "active"
  });

  if (!assignment)
    return res.status(404).json({ msg: "No active assignment" });

  assignment.status = "closed";
  assignment.returnedDate = new Date();
  await assignment.save();

  asset.status = "available";
  await asset.save();

  res.json({ msg: "Returned" });
};



export const getEmployeeHistory = async (req, res) => {
  const employee = await EmployeeMaster.findOne({
    employeeId: req.params.id
  });

  const history = await AssetAssignment.find({
    employee: employee._id
  })
    .populate("asset") // get laptop details
    .sort({ createdAt: -1 });

  res.json(history);
};

export const getAssetHistory = async (req, res) => {
  const asset = await Asset.findOne({
    assetCode: req.params.code
  });

  const history = await AssetAssignment.find({
    asset: asset._id
  })
    .populate("employee")
    .sort({ createdAt: -1 });

  res.json(history);
};