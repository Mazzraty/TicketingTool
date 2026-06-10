import express from "express";

import {
  getDashboardStats,
  getRecentAssets,
  getRecentTickets,
  getRecentSoftware,
} from "../controllers/dashboardController.js";

import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   DASHBOARD (ADMIN ONLY)
   + COMPANY SAFE
========================= */
router.get(
  "/stats",
  protect,
  adminOnly,
  companyCheck,
  getDashboardStats
);

router.get(
  "/recent-assets",
  protect,
  adminOnly,
  companyCheck,
  getRecentAssets
);

router.get(
  "/recent-tickets",
  protect,
  adminOnly,
  companyCheck,
  getRecentTickets
);

router.get(
  "/recent-software",
  protect,
  adminOnly,
  companyCheck,
  getRecentSoftware
);

export default router;