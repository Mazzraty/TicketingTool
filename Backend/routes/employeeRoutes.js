import express from "express";

import {
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  createEmployee,
  bulkUploadEmployees,
} from "../controllers/emplyeeController.js";

import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   EMPLOYEE CRUD (ADMIN ONLY)
   COMPANY ISOLATED
========================= */

// GET ALL
router.get(
  "/",
  protect,
  adminOnly,
  companyCheck,
  getEmployees
);

// GET ONE
router.get(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  getEmployee
);

// CREATE
router.post(
  "/",
  protect,
  adminOnly,
  companyCheck,
  createEmployee
);

// UPDATE
router.put(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  updateEmployee
);

// DELETE
router.delete(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  deleteEmployee
);

/* =========================
   BULK UPLOAD
========================= */
router.post(
  "/bulk-upload",
  protect,
  adminOnly,
  companyCheck,
  bulkUploadEmployees
);

export default router;