// models/taskSchema.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* Material consumed (table rows: SN is just the row index) */
const materialSchema = new Schema({
  item: { type: String, required: true, trim: true, maxlength: 200 },
  qty: { type: Number, required: true, min: 1 },
  collectedFrom: {
    type: String,
    enum: ["IT", "Store", "New Purchase"],
    required: true,
  },
  date: { type: Date },
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

const taskSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" }, // optional link

    /* Assignment */
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Completed"],
      default: "Assigned",
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 }, // cumulative %

    materials: [materialSchema],
    dailyUpdates: [dailyUpdateSchema],

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

export default mongoose.model("Task", taskSchema);