import express from "express";
import {
  getMyNotifications,
  markAsRead,
  clearReadNotifications,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear-read", protect, clearReadNotifications);
router.delete("/clear-all", protect, clearAllNotifications);

export default router;