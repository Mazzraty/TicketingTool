// scripts/backfillNextRunAt.js
// One-time: gives existing recurring tasks a nextRunAt so the scheduler picks them up.
// Run once with:  node scripts/backfillNextRunAt.js
// Only the LATEST task of each series is updated (tasks that have no child yet),
// so a series never gets two "live" tasks.
import "dotenv/config";
import mongoose from "mongoose";
import Task from "../models/taskSchema.js";
import { nextDeadline } from "../controllers/taskController.js";

await mongoose.connect(process.env.MONGO_URI); // change to your env variable name

const candidates = await Task.find({
  recurrence: { $nin: [null, "None"] },
  nextRunAt: { $in: [null, undefined] },
}).select("_id deadline recurrence");

let updated = 0;
for (const t of candidates) {
  const hasChild = await Task.exists({ parentTaskId: t._id });
  if (hasChild) continue;

  await Task.updateOne(
    { _id: t._id },
    { $set: { nextRunAt: nextDeadline(t.deadline, t.recurrence) } }
  );
  updated++;
}

console.log(`Backfilled ${updated} recurring task(s)`);
await mongoose.disconnect();