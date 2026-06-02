// controllers/notificationController.js

import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  const data = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data });
};

export const markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });

  res.json({ success: true });
};