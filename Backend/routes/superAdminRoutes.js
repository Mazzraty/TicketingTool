import express from "express";

import {
  assignCompanyAccess,
  revokeCompanyAccess,
  getAllEmployees,
} from "../controllers/superAdminController.js";

import {
  protect,
  isSuperAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
  🔐 SUPER ADMIN ONLY
========================= */

// GET ALL EMPLOYEES (IMPORTANT)
router.get(
  "/employees",
  protect,
  isSuperAdmin,
  getAllEmployees
);

// ASSIGN COMPANY ACCESS
router.post(
  "/users/:userId/assign-company",
  protect,
  isSuperAdmin,
  assignCompanyAccess
);

// REVOKE COMPANY ACCESS
router.post(
  "/users/:userId/revoke-company",
  protect,
  isSuperAdmin,
  revokeCompanyAccess
);



export default router;