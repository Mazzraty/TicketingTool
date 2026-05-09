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
      return res.status(400).json({ message: "Invalid data format" });
    }

    const clean = (v) => (v ? v.toString().trim() : "");

    let inserted = 0;
    let skipped = 0;
    let failedRows = [];

    for (const e of employees) {
      try {
        const staffCode = clean(e.staffCode);
        const name = clean(e.name);

        if (!staffCode || !name) {
          skipped++;
          failedRows.push({ e, reason: "Missing staffCode or name" });
          continue;
        }

        // 🔍 check duplicate
        const exists = await EmployeeMaster.findOne({ staffCode });

        if (exists) {
          skipped++;
          continue;
        }

        await EmployeeMaster.create({
          staffCode,
          name,
          department: clean(e.department),
          designation: clean(e.designation),
          division: clean(e.division),
          status: "active",
        });

        inserted++;

      } catch (err) {
        skipped++;
        failedRows.push({ e, reason: err.message });
      }
    }

    res.json({
      success: true,
      inserted,
      skipped,
      total: employees.length,
      failedRows,
    });

  } catch (err) {
    console.error("BULK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};