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
      return res.status(400).json({
        message: "No employee data found",
      });
    }

    // 🔥 PUT IT HERE (REPLACE YOUR OLD formatted BLOCK)
    const formatted = employees.map((emp) => ({
      staffCode: emp.staffCode || emp["Staff Code"] || emp.employeeId,
      name: emp.name || emp["Full Name"] || emp.employeeName,
      dateOfJoining: emp.dateOfJoining || emp["Date of Joining"],
      division: emp.division || "",
      department: emp.department || "",
      designation: emp.designation || "",
      placeOfWork: emp.placeOfWork || "",
      visaNo: emp.visaNo || "",
      status: emp.status || "active",
    }));

    // 🔍 DEBUG (VERY IMPORTANT)
    console.log("RAW EMPLOYEES:", employees);
    console.log("FORMATTED:", formatted);

    // ❌ filter invalid rows (prevents crash)
    const clean = formatted.filter(
      (e) => e.staffCode && e.name
    );

    if (!clean.length) {
      return res.status(400).json({
        message: "No valid employee rows found",
      });
    }

    await EmployeeMaster.insertMany(clean);

    res.json({
      success: true,
      message: "Employees uploaded successfully",
      count: clean.length,
    });

  } catch (err) {
    console.error("BULK UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};