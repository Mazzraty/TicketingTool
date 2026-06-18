import express from "express";

import {
  assignCompanyAccess,
  revokeCompanyAccess,
  getUserCompanyAccess,
  getAllUsers,
} from "../controllers/superAdminController.js";

import {
  protect,
  isSuperAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
  🔐 SUPER ADMIN ONLY
========================= */

// GET ALL USERS (IMPORTANT)
router.get(
  "/users",
  protect,
  isSuperAdmin,
  getAllUsers
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

// GET USER COMPANY ACCESS
router.get(
  "/users/:userId/company-access",
  protect,
  isSuperAdmin,
  getUserCompanyAccess
);

export default router;