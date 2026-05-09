import EmployeeMaster from "../models/employeeMasterSchema.js";
import XLSX from "xlsx";

// GET ALL
export const getEmployees = async (req, res) => {
  const data = await EmployeeMaster.find().sort({ createdAt: -1 });
  res.json(data);
};

// GET ONE
export const getEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOne({
    employeeId: req.params.id
  });
  res.json(emp);
};

// UPDATE
export const updateEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOneAndUpdate(
    { employeeId: req.params.id },
    req.body,
    { new: true }
  );
  res.json(emp);
};

// DELETE
export const deleteEmployee = async (req, res) => {
  await EmployeeMaster.deleteOne({
    employeeId: req.params.id
  });
  res.json({ msg: "Deleted" });
};

// 🚀 BULK UPLOAD
export const bulkUploadEmployees = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const clean = (v) => v?.toString().trim();

    const formatted = employees.map((e) => ({
      staffCode: clean(e.staffCode),
      name: clean(e.name),
      department: clean(e.department),
      designation: clean(e.designation),
      division: clean(e.division),
      status: "active",
    }));

    const valid = formatted.filter((e) => e.staffCode && e.name);
    const failed = formatted.filter((e) => !(e.staffCode && e.name));

    const inserted = await EmployeeMaster.insertMany(valid, {
      ordered: false,
    });

    res.json({
      success: true,
      inserted: inserted.length,
      failedCount: failed.length,
      failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};