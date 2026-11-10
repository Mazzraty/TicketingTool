// models/notifcationSchema.js  (your existing model + task notification types)
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // new: set for task notifications
    title: String,
    message: String,
    type: {
      type: String,
      enum: [
        "ticket",
        "ticket_created",
        "ticket_escalated",
        "ticket_reminder",
        "rating_request",
        "status",
        "system",
        "comment",
        // new: task notifications
        "task_assigned",
        "task_accepted",
        "task_rejected",
        "materials_saved",
        "task_closed",
        "task_repeated",
      ],
      default: "ticket",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, companyId: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);