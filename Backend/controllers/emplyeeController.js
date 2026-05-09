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

    const clean = (str) =>
      str?.toString().trim();

    const formatted = employees.map((emp) => ({
      staffCode: clean(
        emp["Staff Code"] ||
        emp["staff code"] ||
        emp["StaffCode"] ||
        emp.employeeId
      ),

      name: clean(
        emp["Name of Staff"] ||
        emp["Full Name"] ||
        emp["name of staff"] ||
        emp.employeeName ||
        emp.name
      ),

      dateOfJoining: emp["Date of Joining"] || emp.dateOfJoining || null,

      division: emp["Division"] || emp.division || "",

      department: emp["Department"] || emp.department || "",

      designation: emp["Designation"] || emp.designation || "",

      placeOfWork: emp["Place of Work"] || emp.placeOfWork || "",

      visaNo: emp["Visa No / ID"] || emp["Visa No"] || emp.visaNo || "",

      status: emp.status || "active",
    }));

    console.log("RAW EMPLOYEES:", employees);
    console.log("FORMATTED:", formatted);

    // 🚨 remove invalid rows properly
    const cleanRows = formatted.filter(
      (e) => e.staffCode && e.name
    );

    if (!cleanRows.length) {
      return res.status(400).json({
        message: "No valid employee rows found",
      });
    }

    // 🚀 safer insert (skip duplicates instead of crash)
    await EmployeeMaster.insertMany(cleanRows, {
      ordered: false,
    });

    res.json({
      success: true,
      message: "Employees uploaded successfully",
      count: cleanRows.length,
    });

  } catch (err) {
    console.error("BULK UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};