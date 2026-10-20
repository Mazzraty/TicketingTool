import cron from "node-cron";
import nodemailer from "nodemailer";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import User from "../models/userShema.js"; 

/* =========================
   CONFIG
========================= */
const TZ = "Asia/Qatar";
const SCHEDULE = "0 8 * * *"; // every day at 08:00 Qatar time
const DAY = 1000 * 60 * 60 * 24;

// Alert stages: first match wins (checked from most severe to least)
const stageFor = (days) => {
  if (days < 0) return "expired";
  if (days <= 7) return "7d";
  if (days <= 15) return "15d";
  if (days <= 30) return "30d";
  return "";
};

const STAGE_LABEL = {
  expired: "Expired",
  "7d": "Expires within 7 days",
  "15d": "Expires within 15 days",
  "30d": "Expires within 30 days",
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);

/* =========================
   MAILER (SMTP via env)
   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
========================= */
let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
};

/* =========================
   WHO GETS THE EMAIL
   Admins / HR of that company (+ optional global fallback list)
========================= */
const getRecipients = async (companyId) => {
  const ROLES = ["hr", "company_admin"];

  const users = await User.find({
    $or: [
      // role stored directly on the user for their own company
      { role: { $in: ROLES }, companyId },
      // role granted through Company Access (not revoked)
      {
        companyAccess: {
          $elemMatch: {
            companyId,
            role: { $in: ROLES },
            revokedAt: null,
          },
        },
      },
    ],
  }).select("email");

  const emails = users.map((u) => u.email).filter(Boolean);

  if (process.env.VISA_ALERT_FALLBACK_EMAILS) {
    emails.push(...process.env.VISA_ALERT_FALLBACK_EMAILS.split(","));
  }
  return [...new Set(emails.map((e) => e.trim()))];
};

/* =========================
   EMAIL BODY
========================= */
const buildHtml = (companyName, rows) => {
  const tr = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #DFE1E6">${r.staffCode}</td>
        <td style="padding:6px 10px;border:1px solid #DFE1E6">${r.name}</td>
        <td style="padding:6px 10px;border:1px solid #DFE1E6">${r.department || "—"}</td>
        <td style="padding:6px 10px;border:1px solid #DFE1E6">${r.visaNo || "—"}</td>
        <td style="padding:6px 10px;border:1px solid #DFE1E6">${fmtDate(r.visaExpiryDate)}</td>
        <td style="padding:6px 10px;border:1px solid #DFE1E6;color:${
          r.stage === "expired" ? "#BF2600" : "#172B4D"
        };font-weight:600">${STAGE_LABEL[r.stage]}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#172B4D">
      <h2>Visa expiry alert – ${companyName || "Company"}</h2>
      <p>${rows.length} employee(s) need attention:</p>
      <table style="border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#F4F5F7;text-align:left">
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Staff code</th>
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Name</th>
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Department</th>
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Visa no</th>
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Expiry</th>
            <th style="padding:6px 10px;border:1px solid #DFE1E6">Status</th>
          </tr>
        </thead>
        <tbody>${tr}</tbody>
      </table>
    </div>`;
};

/* =========================
   MAIN JOB
   - Scans active employees that have a visaExpiryDate within 30 days (or past)
   - Works out each one's stage (30d / 15d / 7d / expired)
   - Only alerts when the stage CHANGED since the last alert (no daily spam)
   - Resets the stage automatically when the visa is renewed
========================= */
let running = false;

export const runVisaExpiryCheck = async () => {
  if (running) return { skipped: true };
  running = true;

  try {
    const today = startOfDay(new Date());
    const horizon = new Date(today.getTime() + 31 * DAY);

    // 1) Employees inside the alert window (includes already-expired)
    const inWindow = await EmployeeMaster.find({
      status: "active",
      visaExpiryDate: { $ne: null, $lte: horizon },
    }).select(
      "companyId company staffCode name department visaNo visaExpiryDate visaAlertStage"
    );

    const ops = [];
    const toNotify = new Map(); // companyId -> { companyName, rows[] }

    for (const emp of inWindow) {
      const days = Math.ceil(
        (startOfDay(emp.visaExpiryDate) - today) / DAY
      );
      const stage = stageFor(days);
      if (!stage || stage === emp.visaAlertStage) continue;

      ops.push({
        updateOne: {
          filter: { _id: emp._id },
          update: {
            $set: { visaAlertStage: stage, visaAlertSentAt: new Date() },
          },
        },
      });

      const key = String(emp.companyId);
      if (!toNotify.has(key)) {
        toNotify.set(key, { companyName: emp.company, rows: [] });
      }
      toNotify.get(key).rows.push({
        staffCode: emp.staffCode,
        name: emp.name,
        department: emp.department,
        visaNo: emp.visaNo,
        visaExpiryDate: emp.visaExpiryDate,
        stage,
        days,
      });
    }

    // 2) Reset stage for renewed visas (expiry now > 30 days away) or cleared dates
    const resetRes = await EmployeeMaster.updateMany(
      {
        visaAlertStage: { $ne: "" },
        $or: [
          { visaExpiryDate: null },
          { visaExpiryDate: { $gt: horizon } },
        ],
      },
      { $set: { visaAlertStage: "", visaAlertSentAt: null } }
    );

    // 3) Send one digest per company (most urgent first)
    const mail = getTransporter();
    let emailsSent = 0;

    for (const [companyId, { companyName, rows }] of toNotify) {
      rows.sort((a, b) => a.days - b.days);
      const recipients = await getRecipients(companyId);

      if (!mail || recipients.length === 0) {
        console.warn(
          `[visa-cron] ${rows.length} alert(s) for "${companyName}" but no SMTP or recipients – skipped email`
        );
        continue;
      }

      try {
        await mail.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: recipients,
          subject: `Visa alert: ${rows.length} employee(s) – ${companyName}`,
          html: buildHtml(companyName, rows),
        });
        emailsSent++;
      } catch (err) {
        console.error(`[visa-cron] email failed for ${companyName}:`, err.message);
      }
    }

    // 4) Persist stage changes
    if (ops.length) await EmployeeMaster.bulkWrite(ops);

    const summary = {
      flagged: ops.length,
      reset: resetRes.modifiedCount,
      companiesNotified: toNotify.size,
      emailsSent,
    };
    console.log("[visa-cron] done", summary);
    return summary;
  } catch (err) {
    console.error("[visa-cron] failed:", err);
    throw err;
  } finally {
    running = false;
  }
};

/* =========================
   SCHEDULER
========================= */
export const startVisaExpiryCron = () => {
  cron.schedule(
    SCHEDULE,
    () => runVisaExpiryCheck().catch(() => {}),
    { timezone: TZ }
  );
  console.log(`[visa-cron] scheduled "${SCHEDULE}" (${TZ})`);
};

/* =========================
   AUTO-START (imported from server.js like your other crons)
========================= */
startVisaExpiryCron();