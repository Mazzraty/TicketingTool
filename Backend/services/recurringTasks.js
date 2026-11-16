// services/recurringTasks.js
// Run: npm i node-cron
import cron from "node-cron";
import mongoose from "mongoose";
import Task from "../models/taskSchema.js";
import { generateTaskNumber, nextDeadline, notify } from "../controllers/taskController.js";

export const runRecurringTasks = async () => {
  const now = new Date();

  while (true) {
    // Atomically claim ONE due task so two runs (or two servers) can't both create it.
    // returnDocument "before" returns the document as it was, so we still know the old nextRunAt.
    const src = await Task.findOneAndUpdate(
      { recurrence: { $nin: [null, "None"] }, nextRunAt: { $ne: null, $lte: now } },
      { $set: { nextRunAt: null } },
      { returnDocument: "before" }
    );
    if (!src) break;

    try {
      const company = await mongoose.model("Company").findById(src.companyId).select("code").lean();
      if (!company?.code) throw new Error("Company code missing");

      // Deadline = end of the new period (skips periods missed while the server was down)
      let due = nextDeadline(src.nextRunAt, src.recurrence);
      while (due <= now) due = nextDeadline(due, src.recurrence);

      const next = await Task.create({
        companyId: src.companyId,
        taskNumber: await generateTaskNumber(src.companyId, company.code),
        title: src.title,
        description: src.description,
        priority: src.priority,
        ticketId: src.ticketId,
        assignedTo: src.assignedTo,
        assignedBy: src.assignedBy,
        assignedAt: now,
        deadline: due,
        recurrence: src.recurrence,
        nextRunAt: due, // the following occurrence is created when this period ends
        parentTaskId: src._id,
        acceptance: { status: "Accepted", respondedAt: now }, // series already accepted
      });

      notify(
        src.assignedTo,
        next,
        "task_repeated",
        `${src.recurrence} task auto-assigned: ${next.taskNumber} due ${due.toLocaleDateString()}`
      );
    } catch (err) {
      console.error("RECURRING TASK ERROR:", err);
      // Put it back so the next cron run retries
      await Task.updateOne({ _id: src._id }, { $set: { nextRunAt: src.nextRunAt } });
      break; // avoid an endless retry loop within this run
    }
  }
};

let started = false;

export const startRecurringTaskJob = () => {
  if (started) return;
  started = true;

  cron.schedule("*/5 * * * *", () => {
    runRecurringTasks().catch((e) => console.error("CRON ERROR:", e));
  });

  // Also catch up immediately on server start
  runRecurringTasks().catch((e) => console.error("CRON ERROR:", e));

  console.log("Recurring task scheduler started");
};