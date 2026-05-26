import express from "express";
import { getDashboardStats, getRecentAssets, getRecentTickets } from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/recent-assets", protect, adminOnly, getRecentAssets);
router.get("/recent-tickets", protect, adminOnly, getRecentTickets);

export default router;