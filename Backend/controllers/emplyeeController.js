import EmployeeMaster from "../models/employeeMasterSchema.js";
import Asset from "../models/assetSchema.js";
import Company from "../models/comapnySchema.js";
import mongoose from "mongoose";

/* =========================
   HELPERS
========================= */
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
    .filter((entry) => !entry?.revokedAt)
    .map((entry) => normalizeCompanyId(entry?.companyId))
    .filter(Boolean);

  if (fromAccess.length > 0) {
    ids.push(...fromAccess);
  }

  return [...new Set(ids)];
};

/* =========================
   HELPER: COMPANY FILTER
   - super_admin: sees all companies by default,
     or a single company when ?companyId= is passed
   - other roles: always locked to their allowed companyId(s),
     regardless of any companyId query param they might send
========================= */
const getCompanyFilter = (user, query = {}) => {
  if (!user) return {};

  if (user.role === "super_admin") {
    const selectedCompanyId = user.companyId || query.companyId;
    return selectedCompanyId ? { companyId: selectedCompanyId } : {};
  }

  if (user.role === "it_support") {
    return user.companyId ? { companyId: user.companyId } : { companyId: null };
  }

  const allowedCompanyIds = getAllowedCompanyIds(user);

  if (!allowedCompanyIds || allowedCompanyIds.length === 0) {
    return { companyId: null };
  }

  return { companyId: { $in: allowedCompanyIds } };
};

/* =========================
   HELPER: DATE PARSER
   Accepts: Date, Excel serial number, "YYYY-MM-DD",
            "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YYYY"
   Empty -> null, invalid -> throws (status 400)
========================= */
const parseDate = (value, label = "date") => {
  if (value === undefined || value === null || value === "") return null;

  let d;

  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    // Excel serial date
    d = new Date(Math.round((value - 25569) * 86400 * 1000));
  } else {
    const s = String(value).trim();
    if (!s) return null;

    const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) {
      d = new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
    } else if (/^\d{5}$/.test(s)) {
      d = new Date(Math.round((Number(s) - 25569) * 86400 * 1000));
    } else {
      d = new Date(s);
    }
  }

  if (!d || isNaN(d.getTime())) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }

  return d;
};

/* =========================
   HELPER: WHITELIST EMPLOYEE FIELDS
   Stops clients from setting companyId, company,
   visaAlertStage, visaAlertSentAt, etc. via the body
========================= */
const EMPLOYEE_FIELDS = [
  "staffCode",
  "name",
  "dateOfJoining",
  "division",
  "department",
  "designation",
  "placeOfWork",
  "visaNo",
  "visaExpiryDate",
  "status",
];

const pickEmployeeFields = (body = {}) => {
  const out = {};

  for (const key of EMPLOYEE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }

  if (typeof out.staffCode === "string") out.staffCode = out.staffCode.trim();
  if (typeof out.name === "string") out.name = out.name.trim();

  if ("dateOfJoining" in out) {
    out.dateOfJoining = parseDate(out.dateOfJoining, "dateOfJoining");
  }
  if ("visaExpiryDate" in out) {
    out.visaExpiryDate = parseDate(out.visaExpiryDate, "visaExpiryDate");
  }

  return out;
};

/* =========================
   GET ALL EMPLOYEES
========================= */
export const getEmployees = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user, req.query);

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
    const filter = getCompanyFilter(req.user, req.query);

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
    const data = pickEmployeeFields(req.body);

    if (!data.staffCode || !data.name) {
      return res.status(400).json({
        message: "staffCode and name required",
      });
    }

    // ✅ super_admin: selected company or body companyId; others: own company
    const targetCompanyId =
      req.user.role === "super_admin"
        ? req.user.companyId || req.body.companyId
        : req.user.companyId;

    if (!targetCompanyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(normalizeCompanyId(targetCompanyId))) {
      return res.status(400).json({ message: "Company ID is invalid" });
    }

    // ✅ Always read the name from the DB (req.user.companyName can be stale)
    const company = await Company.findById(targetCompanyId).select("name");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const exists = await EmployeeMaster.findOne({
      staffCode: data.staffCode,
      companyId: targetCompanyId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Employee already exists",
      });
    }

    const emp = await EmployeeMaster.create({
      ...data,
      companyId: targetCompanyId,
      company: company.name || "",
      // visaAlertStage defaults to "" -> the visa cron picks this employee up
      // on its next run if the visa is already expiring/expired
    });

    res.json(emp);
  } catch (err) {
    // unique index { companyId, staffCode } race condition
    if (err.code === 11000) {
      return res.status(400).json({ message: "Employee already exists" });
    }
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================
   UPDATE EMPLOYEE
========================= */
export const updateEmployee = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user, req.query);
    const data = pickEmployeeFields(req.body);

    // Visa date changed -> let the cron re-evaluate the alert stage from scratch
    if ("visaExpiryDate" in data) {
      data.visaAlertStage = "";
      data.visaAlertSentAt = null;
    }

    const emp = await EmployeeMaster.findOneAndUpdate(
      {
        _id: req.params.id,
        ...filter,
      },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(emp);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Staff code already exists in this company" });
    }
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================
   DELETE EMPLOYEE
========================= */
export const deleteEmployee = async (req, res) => {
  try {
    const filter = getCompanyFilter(req.user, req.query);

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

    const requestedCompanyId =
      req.user.role === "super_admin"
        ? req.user.companyId || req.body.companyId
        : req.user.companyId;
    const allowedCompanyIds = getAllowedCompanyIds(req.user);
    const targetCompanyId =
      requestedCompanyId ||
      req.user.companyAccess?.find((entry) => entry?.isActive)?.companyId;

    if (!targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Target company is required",
      });
    }

    const targetCompanyIdString = normalizeCompanyId(targetCompanyId);
    if (!mongoose.Types.ObjectId.isValid(targetCompanyIdString)) {
      return res.status(400).json({
        success: false,
        message: "Target company ID is invalid",
      });
    }

    if (
      allowedCompanyIds &&
      !allowedCompanyIds.includes(targetCompanyIdString)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to the target company",
      });
    }

    const company = await Company.findById(targetCompanyIdString).select("name");
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Target company not found",
      });
    }
    const targetCompanyName = company.name || req.user.companyName || "";

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
          companyId: targetCompanyIdString,
        });

        if (exists) {
          skipped++;
          failedRows.push({
            row: e,
            reason: `staffCode "${staffCode}" already exists in this company`,
          });
          continue;
        }

        // ✅ Dates (supports Excel serials, YYYY-MM-DD, DD/MM/YYYY)
        const dateOfJoining = parseDate(
          e.dateOfJoining || e["Date Of Joining"],
          "dateOfJoining"
        );
        const visaExpiryDate = parseDate(
          e.visaExpiryDate ||
            e.visaExpiry ||
            e["Visa Expiry Date"] ||
            e["Visa Expiry"],
          "visaExpiryDate"
        );

        await EmployeeMaster.create({
          staffCode,
          name,
          department: clean(e.department),
          designation: clean(e.designation),
          division: clean(e.division),
          placeOfWork: clean(e.placeOfWork),
          visaNo: clean(e.visaNo || e["Visa No"]),
          dateOfJoining,
          visaExpiryDate, // ✅ now saved, so the visa cron + stats work
          status: "active",

          companyId: targetCompanyIdString,
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
          companyId: targetCompanyIdString,
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

          companyId: targetCompanyIdString,
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