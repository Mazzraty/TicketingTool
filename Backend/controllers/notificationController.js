import Notification from "../models/notifcationSchema.js";

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

export const clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id, isRead: true });
    res.json({ success: true, message: "Cleared read notifications" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: "Cleared all notifications" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};