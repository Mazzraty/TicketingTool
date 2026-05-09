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

    console.log("📦 RAW INPUT:", employees);

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No employee data found",
      });
    }

    // 🔧 safe value extractor
    const get = (obj, keys) => {
      for (let key of keys) {
        if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
          return obj[key];
        }
      }
      return "";
    };

    const clean = (val) =>
      val?.toString().trim().replace(/\s+/g, " ") || "";

    // 🔥 normalize data
    const formatted = employees.map((emp) => ({
      staffCode: clean(
        get(emp, [
          "Staff Code",
          "StaffCode",
          "staffCode",
          "employeeId",
          "EMP ID",
          "Emp ID",
        ])
      ),

      name: clean(
        get(emp, [
          "Name of Staff",
          "Full Name",
          "Employee Name",
          "Name",
          "employeeName",
        ])
      ),

      dateOfJoining:
        get(emp, ["Date of Joining", "DOJ", "dateOfJoining"]) || null,

      division: clean(get(emp, ["Division", "division"])),

      department: clean(get(emp, ["Department", "department"])),

      designation: clean(get(emp, ["Designation", "designation"])),

      placeOfWork: clean(get(emp, ["Place of Work", "placeOfWork"])),

      visaNo: clean(
        get(emp, ["Visa No / ID", "Visa No", "visaNo", "ID No"])
      ),

      status: clean(emp.status) || "active",
    }));

    console.log("📊 FORMATTED:", formatted);

    // 🔥 filter valid rows only
    const cleanRows = formatted.filter(
      (e) => e.staffCode && e.name
    );

    console.log("✅ VALID ROWS:", cleanRows.length);

    if (cleanRows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid employee rows found. Check Excel column names (Staff Code, Name).",
        debugSample: formatted.slice(0, 3),
      });
    }

    // 🚀 insert safely (skip duplicates)
    const result = await EmployeeMaster.insertMany(cleanRows, {
      ordered: false, // continues even if duplicates exist
    });

    return res.status(200).json({
      success: true,
      message: "Employees uploaded successfully",
      inserted: result.length,
      total: cleanRows.length,
    });
  } catch (err) {
    console.error("❌ BULK UPLOAD ERROR:", err);

    // handle duplicate errors cleanly
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Uploaded with some duplicates skipped",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};