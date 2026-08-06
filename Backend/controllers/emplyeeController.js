import EmployeeMaster from "../models/employeeMasterSchema.js";
import Asset from "../models/assetSchema.js";
import Company from "../models/comapnySchema.js";

const normalizeCompanyId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    if (value._id && typeof value._id.toString === "function") {
      return value._id.toString();
    }
    if (typeof value.toString === "function") {
      return value.toString();
    }
    return null;
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return value;
};

export const getAllowedCompanyIds = (user) => {
  if (!user) return [];
  if (user.role === "super_admin") return null;

  const ids = [];

  const topLevelId = normalizeCompanyId(user.companyId);
  if (topLevelId) {
    ids.push(topLevelId);
  }

  const fromAccess = (user.companyAccess || [])
    .map((entry) => normalizeCompanyId(entry?.companyId))
    .filter(Boolean);

  if (fromAccess.length > 0) {
    ids.push(...fromAccess);
  }

  return [...new Set(ids)];
};

/* =========================
   HELPER: COMPANY FILTER
========================= */
const getCompanyFilter = (user) => {
  if (!user) return {};
  if (user.role === "super_admin") return {};

  const allowedCompanyIds = getAllowedCompanyIds(user);

  if (!allowedCompanyIds || allowedCompanyIds.length === 0) {
    return { companyId: null };
  }

  return { companyId: { $in: allowedCompanyIds } };
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
/* =========================
   CREATE EMPLOYEE
========================= */
export const createEmployee = async (req, res) => {
  try {
    const { staffCode, name, companyId: bodyCompanyId } = req.body;

    if (!staffCode || !name) {
      return res.status(400).json({
        message: "staffCode and name required",
      });
    }

    // ✅ Use companyId from body for super_admin, or from user for regular admin
    const targetCompanyId = 
      req.user.role === "super_admin" 
        ? bodyCompanyId 
        : req.user.companyId;

    if (!targetCompanyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    const exists = await EmployeeMaster.findOne({
      staffCode,
      companyId: targetCompanyId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Employee already exists",
      });
    }

    // ✅ Get company name
    let companyName = req.user.companyName || "";
    if (req.user.role === "super_admin" && bodyCompanyId) {
      const company = await Company.findById(bodyCompanyId).select("name");
      companyName = company?.name || "";
    }

    const emp = await EmployeeMaster.create({
      ...req.body,
      companyId: targetCompanyId,
      company: companyName,
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

    const targetCompanyId = req.body.companyId || req.user.companyId;
    if (!targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Target company is required",
      });
    }

    let targetCompanyName = req.user.companyName || "";
    if (req.user.role === "super_admin" && req.body.companyId) {
      const company = await Company.findById(req.body.companyId).select("name");
      targetCompanyName = company?.name || targetCompanyName;
    }

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

        // 🔥 CHANGED: staffCode is now checked GLOBALLY (no companyId filter),
        // so the same staffCode can't exist under any company.
        const exists = await EmployeeMaster.findOne({ staffCode });

        if (exists) {
          skipped++;
          failedRows.push({
            row: e,
            reason: `staffCode "${staffCode}" already exists (company: ${exists.company || exists.companyId})`,
          });
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

          companyId: targetCompanyId,
          company: targetCompanyName,
        });

        inserted++;
      } catch (err) {
        skipped++;
        failedRows.push({ row: e, reason: err.message });
      }
    }

    /* =========================
       ASSETS (unchanged — still scoped per company)
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
          companyId: targetCompanyId,
        });

        if (exists) {
          skipped++;
          continue;
        }

        if (!allowedTypes.includes(a.type)) {
          skipped++;
          continue;
        }

        if (a.type === "HHT" && (!a.model || !a.serialNumber)) {
          skipped++;
          failedRows.push({ row: a, reason: "HHT requires model and serial number" });
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

          companyId: targetCompanyId,
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
