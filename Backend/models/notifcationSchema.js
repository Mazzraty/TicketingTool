// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    title: String,
    message: String,
    type: {
      type: String,
      enum: ["ticket", "ticket_created", "ticket_escalated", "status", "system", "comment"],
      default: "ticket",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, companyId: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);