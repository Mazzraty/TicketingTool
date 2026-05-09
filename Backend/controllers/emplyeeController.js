import EmployeeMaster from "../models/employeeMasterSchema.js";

// GET ALL
export const getEmployees = async (req, res) => {
  const data = await EmployeeMaster.find().sort({ createdAt: -1 });
  res.json(data);
};

// GET ONE
export const getEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findById(req.params.id);
  res.json(emp);
};

// UPDATE
export const updateEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(emp);
};

// DELETE
export const deleteEmployee = async (req, res) => {
  await EmployeeMaster.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
};

// CREATE SINGLE EMPLOYEE
export const createEmployee = async (req, res) => {
  try {
    const emp = await EmployeeMaster.create(req.body);
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// BULK UPLOAD
export const bulkUploadEmployees = async (req, res) => {
  try {
    const employees = req.body.employees || [];

    if (!Array.isArray(employees)) {
      return res.status(400).json({ message: "Invalid data format" });
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

        const exists = await EmployeeMaster.findOne({ staffCode });

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
    res.status(500).json({ message: err.message });
  }
};