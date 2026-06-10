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
   SOFTWARE CRUD (ADMIN ONLY)
   COMPANY SAFE
========================= */

// CREATE
router.post(
  "/",
  protect,
  adminOnly,
  companyCheck,
  createSoftware
);

// GET ALL
router.get(
  "/",
  protect,
  adminOnly,
  companyCheck,
  getSoftwares
);

// DASHBOARD STATS
router.get(
  "/dashboard",
  protect,
  adminOnly,
  companyCheck,
  getDashboardStats
);

// GET BY ID
router.get(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  getSoftwareById
);

// UPDATE
router.put(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  updateSoftware
);

// DELETE
router.delete(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  deleteSoftware
);

export default router;