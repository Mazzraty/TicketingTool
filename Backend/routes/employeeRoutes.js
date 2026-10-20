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
   ROLE GUARD
   Anyone adminOnly already allows keeps access;
   "hr" is added on top. Delete stays adminOnly (HR cannot delete).
========================= */
const adminOrHr = (req, res, next) => {
  if (req.user?.role === "hr") return next();
  return adminOnly(req, res, next);
};

/* =========================
   EMPLOYEE CRUD (COMPANY ISOLATED)
========================= */

// GET ALL EMPLOYEES
router.get("/", protect, companyCheck, adminOrHr, getEmployees);

// GET SINGLE EMPLOYEE
router.get("/:id", protect, companyCheck, adminOrHr, getEmployee);

// CREATE EMPLOYEE
router.post("/", protect, companyCheck, adminOrHr, createEmployee);

// UPDATE EMPLOYEE
router.put("/:id", protect, companyCheck, adminOrHr, updateEmployee);

// DELETE EMPLOYEE (admins only)
router.delete("/:id", protect, companyCheck, adminOnly, deleteEmployee);

/* =========================
   BULK UPLOAD
========================= */
router.post(
  "/bulk-upload",
  protect,
  companyCheck,
  adminOrHr,
  bulkUploadEmployees
);

export default router;