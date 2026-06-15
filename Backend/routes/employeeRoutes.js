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
   EMPLOYEE CRUD (COMPANY ISOLATED)
========================= */

// GET ALL EMPLOYEES
router.get(
  "/",
  protect,
  companyCheck,
  adminOnly,
  getEmployees
);

// GET SINGLE EMPLOYEE
router.get(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  getEmployee
);

// CREATE EMPLOYEE
router.post(
  "/",
  protect,
  companyCheck,
  adminOnly,
  createEmployee
);

// UPDATE EMPLOYEE
router.put(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  updateEmployee
);

// DELETE EMPLOYEE
router.delete(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  deleteEmployee
);

/* =========================
   BULK UPLOAD
========================= */
router.post(
  "/bulk-upload",
  protect,
  companyCheck,
  adminOnly,
  bulkUploadEmployees
);

export default router;