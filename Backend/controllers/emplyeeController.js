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

    if (!employees || !employees.length) {
      return res.status(400).json({ message: "No employee data found" });
    }

    // optional cleanup (normalize fields)
    const formatted = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      status: emp.status || "active"
    }));

    await EmployeeMaster.insertMany(formatted);

    res.json({
      message: "Employees uploaded successfully",
      count: formatted.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};