import EmployeeMaster from "../models/employeeMasterSchema.js";
import Asset from "../models/assetSchema.js";

/* =========================
   HELPER: COMPANY FILTER
========================= */
const getCompanyFilter = (user) => {
  if (user.role === "super_admin") return {};
  return { companyId: user.companyId };
};

/* =========================
   GET ALL EMPLOYEES
========================= */
export const getEmployees = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const data = await EmployeeMaster.find(filter).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET EMPLOYEE BY ID
========================= */
export const getEmployee = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user);

    const emp = await EmployeeMaster.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(emp);
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

    const exists = await EmployeeMaster.findOne({
      staffCode,
      companyId: req.user.companyId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Employee already exists",
      });
    }

    const emp = await EmployeeMaster.create({
      ...req.body,
      companyId: req.user.companyId,
    });

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
    const filter = getCompanyFilter(req.user);

    const emp = await EmployeeMaster.findOneAndUpdate(
      {
        _id: req.params.id,
        ...filter,
      },
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
    const filter = getCompanyFilter(req.user);

    const emp = await EmployeeMaster.findOneAndDelete({
      _id: req.params.id,
      ...filter,
    });

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   BULK UPLOAD (EMPLOYEES + ASSETS)
========================= */
export const bulkUploadEmployees = async (req, res) => {
  try {
    const employees = req.body.employees || [];
    const assets = req.body.assets || [];

    const clean = (v) => (v ? v.toString().trim() : "");

    let inserted = 0;
    let skipped = 0;
    let failedRows = [];

    /* =========================
       EMPLOYEES
    ========================= */
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
          companyId: req.user.companyId,
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
          companyId: req.user.companyId,
        });

        inserted++;
      } catch (err) {
        skipped++;
        failedRows.push({ row: e, reason: err.message });
      }
    }

    /* =========================
       ASSETS
    ========================= */
    const allowedTypes = ["Laptop", "Printer", "HHT", "PC"];

    for (const a of assets) {
      try {
        const assetCode = clean(a.assetCode);

        if (!assetCode) {
          skipped++;
          continue;
        }

        const exists = await Asset.findOne({
          assetCode,
          companyId: req.user.companyId,
        });

        if (exists) {
          skipped++;
          continue;
        }

        if (!allowedTypes.includes(a.type)) {
          skipped++;
          continue;
        }

        await Asset.create({
          assetCode,
          type: a.type,
          model: a.model || "",
          serialNumber: a.serialNumber || "",
          status: "available",

          route: a.route || "",
          salesmanCode: a.salesmanCode || "",
          salesmanName: a.salesmanName || "",
          supervisor: a.supervisor || "",

          imei: a.imei || "",
          simNumber: a.simNumber || "",
          soti: a.soti || "",
          notes: a.notes || "",

          companyId: req.user.companyId,
        });

        inserted++;
      } catch (err) {
        skipped++;
        failedRows.push({ row: a, reason: err.message });
      }
    }

    return res.json({
      success: true,
      inserted,
      skipped,
      total: employees.length + assets.length,
      failedRows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message,
    });
  }
};