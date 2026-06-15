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
   DASHBOARD (COMPANY ISOLATED)
========================= */
router.get(
  "/stats",
  protect,
  companyCheck,
  adminOnly,
  getDashboardStats
);

router.get(
  "/recent-assets",
  protect,
  companyCheck,
  adminOnly,
  getRecentAssets
);

router.get(
  "/recent-tickets",
  protect,
  companyCheck,
  adminOnly,
  getRecentTickets
);

router.get(
  "/recent-software",
  protect,
  companyCheck,
  adminOnly,
  getRecentSoftware
);

export default router;