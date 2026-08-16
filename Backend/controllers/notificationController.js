import Notification from "../models/notifcationSchema.js";

export const buildNotificationFilter = (user = {}) => {
  const filter = {
    userId: user.id || user._id,
  };

  if (user.role !== "super_admin" && user.companyId) {
    filter.companyId = user.companyId;
  }

  return filter;
};

export const getMyNotifications = async (req, res) => {
  const filter = buildNotificationFilter(req.user);
  const data = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data });
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      ...buildNotificationFilter(req.user),
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const markAsRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      ...buildNotificationFilter(req.user),
    },
    { isRead: true }
  );

  res.json({ success: true });
};

export const clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      ...buildNotificationFilter(req.user),
      isRead: true,
    });
    res.json({ success: true, message: "Cleared read notifications" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany(buildNotificationFilter(req.user));
    res.json({ success: true, message: "Cleared all notifications" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};