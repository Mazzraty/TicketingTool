import EmployeeMaster from "../models/employeeMasterSchema.js";
import Asset from "../models/assetSchema.js";

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
    const assets = req.body.assets || [];

    const clean = (v) =>
      v ? v.toString().trim() : "";

    let inserted = 0;
    let skipped = 0;
    let failedRows = [];

    /* =========================================
       EMPLOYEE UPLOAD
    ========================================= */
    if (employees.length > 0) {

      for (const e of employees) {
        try {

          const staffCode = clean(
            e.staffCode ||
            e.employeeId ||
            e["Staff Code"]
          );

          const name = clean(
            e.name ||
            e.employeeName ||
            e["Full Name"]
          );

          if (!staffCode || !name) {
            skipped++;
            continue;
          }

          const exists =
            await EmployeeMaster.findOne({
              staffCode,
            });

          if (exists) {
            skipped++;
            continue;
          }

          await EmployeeMaster.create({
            staffCode,
            name,

            department:
              e.department || "",

            designation:
              e.designation || "",

            division:
              e.division || "",

            placeOfWork:
              e.placeOfWork || "",

            visaNo:
              e.visaNo || "",

            dateOfJoining:
              e.dateOfJoining
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
    }

    /* =========================================
       ASSET UPLOAD (PRINTER / HHT)
    ========================================= */
    if (assets.length > 0) {

      for (const a of assets) {
        try {

          const assetCode = clean(
            a.assetCode
          );

          if (!assetCode) {
            skipped++;
            continue;
          }

          const exists =
            await Asset.findOne({
              assetCode,
            });

          if (exists) {
            skipped++;
            continue;
          }

          await Asset.create({

            assetCode,

            type:
              a.type || "Laptop",

            model:
              a.model || "",

            serialNumber:
              a.serialNumber || "",

            status: "available",

            // PRINTER / HHT
            route:
              a.route || "",

            salesmanCode:
              a.salesmanCode || "",

            salesmanName:
              a.salesmanName || "",

            supervisor:
              a.supervisor || "",

            soti:
              a.soti || "",

            imei:
              a.imei || "",

            simNumber:
              a.simNumber || "",

            notes:
              a.notes || "",
          });

          inserted++;

        } catch (err) {

          skipped++;

          failedRows.push({
            row: a,
            reason: err.message,
          });
        }
      }
    }

    res.json({
      success: true,
      inserted,
      skipped,

      total:
        employees.length +
        assets.length,

      failedRows,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};