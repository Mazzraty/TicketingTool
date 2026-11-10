// controllers/taskController.js
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Task from "../models/taskSchema.js";
import TaskCounter from "../models/taskCounterSchema.js";
import Notification from "../models/notifcationSchema.js";
import User from "../models/userShema.js";
import { getCompanyFilter } from "./dashboardController.js";

const SOURCES = ["IT", "Store", "New Purchase"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const RECURRENCES = ["None", "Daily", "Weekly", "Monthly", "Quarterly"];

const uid = (user) => String(user.id || user._id);
const isSuper = (user) => user.role === "super_admin";
const canEdit = (task, user) =>
  isSuper(user) || String(task.assignedTo?._id || task.assignedTo) === uid(user);

// "YYYY-MM-DD" -> Date at 00:00 UTC (null when invalid)
const dayStart = (str) => {
  if (typeof str !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T00:00:00.000Z`);
  return isNaN(d) ? null : d;
};
const dayKey = (d) => new Date(d).toISOString().split("T")[0];

const removeFiles = (files = []) =>
  files.forEach((f) => fs.unlink(f.path, () => {}));

// <companyCode>-TSK-<year>-<6 digit sequence>
const TASK_TYPE_CODE = "TSK";
const generateTaskNumber = async (companyId, companyCode) => {
  const year = new Date().getFullYear();

  const counter = await TaskCounter.findOneAndUpdate(
    { companyId, year },
    { $inc: { sequence: 1 }, $setOnInsert: { companyId, year } },
    { new: true, upsert: true }
  );

  const sequence = String(counter.sequence).padStart(6, "0");
  return `${companyCode}-${TASK_TYPE_CODE}-${year}-${sequence}`;
};

// Move a deadline forward by one repeat interval
const nextDeadline = (d, rec) => {
  const n = new Date(d);
  if (rec === "Daily") n.setDate(n.getDate() + 1);
  else if (rec === "Weekly") n.setDate(n.getDate() + 7);
  else if (rec === "Monthly") n.setMonth(n.getMonth() + 1);
  else if (rec === "Quarterly") n.setMonth(n.getMonth() + 3);
  return n;
};

// Saves a notification; a failure here never breaks the main request
const notify = (userId, task, type, message) =>
  Notification.create({ userId, taskId: task._id, type, message }).catch((e) =>
    console.error("NOTIFY ERROR:", e)
  );

// Work (materials, daily updates, closing) is blocked until the task is accepted
const requireAccepted = (task) =>
  task.acceptance?.status === "Accepted" ? null : "Accept the task first";

const loadTask = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: [400, "Invalid task id"] };
  const task = await Task.findById(id);
  if (!task) return { error: [404, "Task not found"] };
  if (!canEdit(task, user)) return { error: [403, "Not allowed"] };
  return { task };
};

/* =========================
   IT SUPPORT USERS (for the "Assigned to" dropdown) - super_admin only
========================= */
export const getAssignees = async (req, res) => {
  try {
    if (!isSuper(req.user)) return res.status(403).json({ message: "Not allowed" });
    const users = await User.find({ role: "it_support", isActive: { $ne: false } })
      .select("name email")
      .sort("name")
      .lean();
    res.json(users);
  } catch (err) {
    console.error("GET ASSIGNEES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   CREATE TASK - super_admin only
========================= */
export const createTask = async (req, res) => {
  try {
    if (!isSuper(req.user)) return res.status(403).json({ message: "Only super admin can assign tasks" });

    const { title, description, priority, assignedTo, deadline, companyId, ticketId, recurrence } = req.body;

    if (typeof title !== "string" || !title.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!mongoose.Types.ObjectId.isValid(assignedTo))
      return res.status(400).json({ message: "Select who the task is assigned to" });

    const due = new Date(deadline);
    if (!deadline || isNaN(due))
      return res.status(400).json({ message: "A valid deadline is required" });
    if (due <= new Date())
      return res.status(400).json({ message: "Deadline must be in the future" });

    const assignee = await User.findById(assignedTo).select("role companyId");
    if (!assignee || assignee.role !== "it_support")
      return res.status(400).json({ message: "Assignee must be an IT support user" });

    const cid = companyId || assignee.companyId || req.user.companyId;
    if (!mongoose.Types.ObjectId.isValid(cid))
      return res.status(400).json({ message: "Company is required" });

    const company = await mongoose.model("Company").findById(cid).select("code").lean();
    if (!company) return res.status(400).json({ message: "Company not found" });
    if (!company.code) return res.status(400).json({ message: "Company code is missing" });

    const taskNumber = await generateTaskNumber(cid, company.code);

    const task = await Task.create({
      companyId: cid,
      taskNumber,
      title: title.trim().slice(0, 200),
      description: typeof description === "string" ? description.trim().slice(0, 2000) : "",
      priority: PRIORITIES.includes(priority) ? priority : "Medium",
      ticketId: mongoose.Types.ObjectId.isValid(ticketId) ? ticketId : undefined,
      assignedTo,
      assignedBy: uid(req.user),
      assignedAt: new Date(),
      deadline: due,
      recurrence: RECURRENCES.includes(recurrence) ? recurrence : "None",
      acceptance: { status: "Pending" },
    });

    notify(assignedTo, task, "task_assigned", `New task ${taskNumber} assigned: ${task.title}`);

    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LIST TASKS
   super_admin: all (optionally one company) | it_support: only own tasks
========================= */
export const getTasks = async (req, res) => {
  try {
    const filter = isSuper(req.user)
      ? getCompanyFilter(req.user, req.query)
      : { assignedTo: uid(req.user) };

    if (["Assigned", "In Progress", "Completed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .select("-dailyUpdates -materials")
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks);
  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET ONE TASK
========================= */
export const getTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name")
      .populate("dailyUpdates.updatedBy", "name")
      .lean();

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canEdit(task, req.user)) return res.status(403).json({ message: "Not allowed" });

    res.json(task);
  } catch (err) {
    console.error("GET TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ACCEPT / REJECT - only the assigned IT support user
========================= */
export const respondTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (String(task.assignedTo) !== uid(req.user))
      return res.status(403).json({ message: "Only the assigned user can accept or reject" });
    if (task.status === "Completed")
      return res.status(400).json({ message: "Task is already closed" });
    if (task.acceptance?.status !== "Pending")
      return res.status(400).json({ message: "You have already responded to this task" });

    const { decision } = req.body;
    if (!["Accepted", "Rejected"].includes(decision))
      return res.status(400).json({ message: "Invalid decision" });

    const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
    if (decision === "Rejected" && !reason)
      return res.status(400).json({ message: "A reason is required to reject a task" });

    task.acceptance = {
      status: decision,
      respondedAt: new Date(),
      reason: decision === "Rejected" ? reason : "",
    };
    await task.save();

    notify(
      task.assignedBy,
      task,
      decision === "Accepted" ? "task_accepted" : "task_rejected",
      `${task.taskNumber || task.title} was ${decision.toLowerCase()}${
        decision === "Rejected" ? `: ${reason}` : ""
      }`
    );

    res.json({ success: true, acceptance: task.acceptance });
  } catch (err) {
    console.error("RESPOND TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   MATERIAL CONSUMED (replaces the whole table)
   Each row: serial number + consumed date & time
========================= */
export const saveMaterials = async (req, res) => {
  try {
    const { task, error } = await loadTask(req.params.id, req.user);
    if (error) return res.status(error[0]).json({ message: error[1] });
    if (task.status === "Completed")
      return res.status(400).json({ message: "Task is already closed" });

    const notAccepted = requireAccepted(task);
    if (notAccepted) return res.status(400).json({ message: notAccepted });

    const rows = Array.isArray(req.body.materials) ? req.body.materials : [];
    const clean = [];

    for (const [i, r] of rows.entries()) {
      const item = typeof r.item === "string" ? r.item.trim() : "";
      if (!item) continue; // skip empty rows

      // Remove this check if serial numbers should be optional
      const serialNo = typeof r.serialNo === "string" ? r.serialNo.trim() : "";
      if (!serialNo)
        return res.status(400).json({ message: `Row ${i + 1}: serial number is required` });

      const qty = Number(r.qty);
      if (!Number.isFinite(qty) || qty < 1)
        return res.status(400).json({ message: `Row ${i + 1}: quantity must be at least 1` });

      const uom = typeof r.uom === "string" ? r.uom.trim() : "";
      if (!uom)
        return res.status(400).json({ message: `Row ${i + 1}: select a unit of measure` });

      if (!SOURCES.includes(r.collectedFrom))
        return res.status(400).json({ message: `Row ${i + 1}: select where it was collected from` });

      const consumedAt = new Date(r.consumedAt);
      if (!r.consumedAt || isNaN(consumedAt))
        return res.status(400).json({ message: `Row ${i + 1}: consumed date & time is required` });

      clean.push({
        serialNo: serialNo.slice(0, 100),
        item: item.slice(0, 200),
        qty,
        uom: uom.slice(0, 50),
        collectedFrom: r.collectedFrom,
        consumedAt,
      });
    }

    task.materials = clean;
    await task.save();

    notify(
      task.assignedBy,
      task,
      "materials_saved",
      `Materials updated on ${task.taskNumber || task.title} (${clean.length} item${clean.length === 1 ? "" : "s"})`
    );

    res.json({ success: true, materials: task.materials });
  } catch (err) {
    console.error("SAVE MATERIALS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DAILY UPDATION (one entry per date - re-submitting a date overwrites it)
========================= */
export const addDailyUpdate = async (req, res) => {
  try {
    const { task, error } = await loadTask(req.params.id, req.user);
    if (error) return res.status(error[0]).json({ message: error[1] });
    if (task.status === "Completed")
      return res.status(400).json({ message: "Task is already closed" });

    const notAccepted = requireAccepted(task);
    if (notAccepted) return res.status(400).json({ message: notAccepted });

    const date = dayStart(req.body.date);
    if (!date) return res.status(400).json({ message: "Select a valid date" });
    if (date > new Date()) return res.status(400).json({ message: "Date cannot be in the future" });

    const percent = Number(req.body.percentToday);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100)
      return res.status(400).json({ message: "Percentage must be between 0 and 100" });

    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 1000) : "";

    const existing = task.dailyUpdates.find((u) => dayKey(u.date) === dayKey(date));
    if (existing) {
      existing.percentToday = percent;
      existing.note = note;
      existing.updatedBy = uid(req.user);
    } else {
      task.dailyUpdates.push({ date, percentToday: percent, note, updatedBy: uid(req.user) });
    }

    task.progress = Math.min(
      100,
      task.dailyUpdates.reduce((sum, u) => sum + u.percentToday, 0)
    );
    if (task.status === "Assigned") task.status = "In Progress";

    await task.save();
    res.json({ success: true, progress: task.progress });
  } catch (err) {
    console.error("DAILY UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   CLOSE TASK
   completedOnTime is computed on the server (now <= deadline).
   If it is late, a justification is mandatory.
   If the task repeats, the next one is created here.
========================= */
export const closeTask = async (req, res) => {
  try {
    const { task, error } = await loadTask(req.params.id, req.user);
    if (error) {
      removeFiles(req.files);
      return res.status(error[0]).json({ message: error[1] });
    }
    if (task.status === "Completed") {
      removeFiles(req.files);
      return res.status(400).json({ message: "Task is already closed" });
    }

    const notAccepted = requireAccepted(task);
    if (notAccepted) {
      removeFiles(req.files);
      return res.status(400).json({ message: notAccepted });
    }

    const now = new Date();
    const onTime = now <= task.deadline;
    const justification =
      typeof req.body.delayJustification === "string" ? req.body.delayJustification.trim().slice(0, 2000) : "";
    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 2000) : "";

    if (!onTime && !justification) {
      removeFiles(req.files);
      return res.status(400).json({ message: "The deadline has passed - please add a delay justification" });
    }

    task.closing = {
      completedAt: now,
      completedOnTime: onTime,
      delayJustification: onTime ? "" : justification,
      note,
      photos: (req.files || []).map((f) => `/uploads/tasks/${path.basename(f.path)}`),
      closedBy: uid(req.user),
    };
    task.status = "Completed";
    task.progress = 100;

    await task.save();

    notify(task.assignedBy, task, "task_closed", `${task.taskNumber || task.title} was closed`);

    /* ----- continuous task: create the next one ----- */
    let nextTask = null;
    if (task.recurrence && task.recurrence !== "None") {
      try {
        let due = nextDeadline(task.deadline, task.recurrence);
        while (due <= now) due = nextDeadline(due, task.recurrence); // skip periods already past

        const company = await mongoose.model("Company").findById(task.companyId).select("code").lean();
        if (company?.code) {
          nextTask = await Task.create({
            companyId: task.companyId,
            taskNumber: await generateTaskNumber(task.companyId, company.code),
            title: task.title,
            description: task.description,
            priority: task.priority,
            ticketId: task.ticketId,
            assignedTo: task.assignedTo,
            assignedBy: task.assignedBy,
            assignedAt: now,
            deadline: due,
            recurrence: task.recurrence,
            parentTaskId: task._id,
            acceptance: { status: "Accepted", respondedAt: now }, // series already accepted
          });

          notify(
            task.assignedTo,
            nextTask,
            "task_repeated",
            `${task.recurrence} task repeated: ${nextTask.taskNumber} due ${due.toLocaleDateString()}`
          );
        }
      } catch (repeatErr) {
        // The task is already closed - don't fail the request because of the repeat
        console.error("CREATE REPEAT TASK ERROR:", repeatErr);
      }
    }

    res.json({ success: true, task, nextTask });
  } catch (err) {
    removeFiles(req.files);
    console.error("CLOSE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};