import express from "express";

import {
  createSoftware,
  getSoftwares,
  getSoftwareById,
  updateSoftware,
  deleteSoftware,
  getDashboardStats,
} from "../controllers/softwareController.js";

import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   SOFTWARE CRUD (COMPANY ISOLATED)
========================= */

// CREATE SOFTWARE
router.post(
  "/",
  protect,
  companyCheck,
  adminOnly,
  createSoftware
);

// GET ALL SOFTWARES
router.get(
  "/",
  protect,
  companyCheck,
  adminOnly,
  getSoftwares
);

// DASHBOARD STATS
router.get(
  "/dashboard",
  protect,
  companyCheck,
  adminOnly,
  getDashboardStats
);

// GET BY ID
router.get(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  getSoftwareById
);

// UPDATE
router.put(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  updateSoftware
);

// DELETE
router.delete(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  deleteSoftware
);

export default router;