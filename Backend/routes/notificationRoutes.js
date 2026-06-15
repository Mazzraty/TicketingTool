import express from "express";

import {
  getMyNotifications,
  markAsRead,
  clearReadNotifications,
  clearAllNotifications,
} from "../controllers/notificationController.js";

import {
  protect,
  companyCheck,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   NOTIFICATIONS (SAAS SAFE)
========================= */

// GET MY NOTIFICATIONS
router.get(
  "/",
  protect,
  companyCheck,
  getMyNotifications
);

// MARK AS READ
router.put(
  "/:id/read",
  protect,
  companyCheck,
  markAsRead
);

// CLEAR READ
router.delete(
  "/clear-read",
  protect,
  companyCheck,
  clearReadNotifications
);

// CLEAR ALL
router.delete(
  "/clear-all",
  protect,
  companyCheck,
  clearAllNotifications
);

export default router;