import EmployeeMaster from "../models/employeeMasterSchema.js";

/* =========================
   GET ALL EMPLOYEES
========================= */
export const getEmployees = async (req, res) => {
  try {
    const data = await EmployeeMaster.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET EMPLOYEE BY ID (Mongo ID)
========================= */
export const getEmployee = async (req, res) => {
  try {
    const emp = await EmployeeMaster.findById(req.params.id);

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   UPDATE EMPLOYEE
========================= */
export const updateEmployee = async (req, res) => {
  try {
    const emp = await EmployeeMaster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE EMPLOYEE
========================= */
export const deleteEmployee = async (req, res) => {
  try {
    const emp = await EmployeeMaster.findByIdAndDelete(req.params.id);

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   CREATE EMPLOYEE
========================= */
export const createEmployee = async (req, res) => {
  try {
    const { staffCode, name } = req.body;

    if (!staffCode || !name) {
      return res.status(400).json({
        message: "staffCode and name required",
      });
    }

    const exists = await EmployeeMaster.findOne({ staffCode });

    if (exists) {
      return res.status(400).json({
        message: "Employee already exists",
      });
    }

    const emp = await EmployeeMaster.create(req.body);

    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   BULK UPLOAD EMPLOYEES
========================= */
export const bulkUploadEmployees = async (req, res) => {
  try {
    const employees = req.body.employees || [];

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        message: "Invalid data format",
      });
    }

    const clean = (v) => (v ? v.toString().trim() : "");

    let inserted = 0;
    let skipped = 0;
    let failedRows = [];

    for (const e of employees) {
      try {
        const staffCode = clean(
          e.staffCode || e.employeeId || e["Staff Code"]
        );

        const name = clean(
          e.name || e.employeeName || e["Full Name"]
        );

        if (!staffCode || !name) {
          skipped++;
          continue;
        }

        const exists = await EmployeeMaster.findOne({
          staffCode,
        });

        if (exists) {
          skipped++;
          continue;
        }

        await EmployeeMaster.create({
          staffCode,
          name,
          department: e.department || "",
          designation: e.designation || "",
          division: e.division || "",
          placeOfWork: e.placeOfWork || "",
          visaNo: e.visaNo || "",
          dateOfJoining: e.dateOfJoining
            ? new Date(e.dateOfJoining)
            : null,
          status: "active",
        });

        inserted++;
      } catch (err) {
        skipped++;
        failedRows.push({
          row: e,
          reason: err.message,
        });
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
    res.status(500).json({
      message: err.message,
    });
  }
};