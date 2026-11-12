// models/taskSchema.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* Material consumed (table rows: SN is just the row index) */
const materialSchema = new Schema({
  serialNo: { type: String, trim: true, maxlength: 100 },
  item: { type: String, required: true, trim: true, maxlength: 200 },
  qty: { type: Number, required: true, min: 1 },
  uom: { type: String, required: true, trim: true, maxlength: 50 },
  collectedFrom: {
    type: String,
    enum: ["IT", "Store", "New Purchase"],
    required: true,
  },
  consumedAt: { type: Date }, // date AND time the material was consumed
  date: { type: Date }, // legacy field (rows saved before consumedAt existed)
});

/* Daily updation: one entry per calendar day */
const dailyUpdateSchema = new Schema(
  {
    date: { type: Date, required: true },
    percentToday: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/* Files saved by IT support while working (before closing) */
const attachmentSchema = new Schema({
  path: { type: String, required: true }, // e.g. /uploads/tasks/123.pdf
  originalName: { type: String, trim: true, maxlength: 255 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    /* Company-wise task number, e.g. "AQC-TSK-2026-000001" */
    taskNumber: { type: String, trim: true, maxlength: 40 },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },

    /* Assignment */
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },

    /* Continuous option: a new task is created automatically when this one is closed */
    recurrence: {
      type: String,
      enum: ["None", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
      default: "None",
    },
    parentTaskId: { type: Schema.Types.ObjectId, ref: "Task" }, // set on auto-created repeats

    /* IT support accepts or rejects the assignment */
    acceptance: {
      status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending",
      },
      respondedAt: { type: Date },
      reason: { type: String, trim: true, maxlength: 1000, default: "" },
    },

    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Completed"],
      default: "Assigned",
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 }, // cumulative %

    materials: [materialSchema],
    dailyUpdates: [dailyUpdateSchema],

    /* Files saved while the task is open (IT support uploads, super admin views) */
    attachments: [attachmentSchema],

    /* Closing details */
    closing: {
      completedAt: { type: Date },
      completedOnTime: { type: Boolean },
      delayJustification: { type: String, trim: true, maxlength: 2000, default: "" },
      note: { type: String, trim: true, maxlength: 2000, default: "" },
      photos: [{ type: String }], // relative URLs, e.g. /uploads/tasks/123.jpg
      closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

// A task number is unique inside one company (old tasks without a number are ignored)
taskSchema.index(
  { companyId: 1, taskNumber: 1 },
  { unique: true, partialFilterExpression: { taskNumber: { $type: "string" } } }
);

export default mongoose.model("Task", taskSchema);