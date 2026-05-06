import EmployeeMaster from "../models/employeeMasterSchema.js";
import XLSX from "xlsx";

// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  const data = await EmployeeMaster.find().sort({ createdAt: -1 });
  res.json(data);
};

// GET SINGLE EMPLOYEE
export const getEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOne({
    employeeId: req.params.id
  });

  res.json(emp);
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOneAndUpdate(
    { employeeId: req.params.id },
    req.body,
    { new: true }
  );

  res.json(emp);
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  await EmployeeMaster.deleteOne({
    employeeId: req.params.id
  });

  res.json({ msg: "Deleted" });
};

// 🚀 BULK UPLOAD (FIXED)
export const bulkUploadEmployees = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const formatted = data.map((item) => ({
      employeeId: item.employeeId,
      name: item.name,
      position: item.position || "Employee",
      department: item.department || "General",
      status: (item.status || "active").toLowerCase()
    }));

    const inserted = await EmployeeMaster.insertMany(formatted, {
      ordered: false
    });

    res.json({
      message: "Employees uploaded successfully",
      insertedCount: inserted.length
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
};