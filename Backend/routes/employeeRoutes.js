import express from "express";
import {
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  createEmployee,
  bulkUploadEmployees,
} from "../controllers/emplyeeController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========================
// CRUD ROUTES
// ========================

router.get("/", protect, adminOnly, getEmployees);

router.get("/:id", protect, adminOnly, getEmployee);

router.post("/", protect, adminOnly, createEmployee);

router.put("/:id", protect, adminOnly, updateEmployee);

router.delete("/:id", protect, adminOnly, deleteEmployee);

// ========================
// BULK UPLOAD ROUTE
// ========================

router.post(
  "/bulk-upload",
  protect,
  adminOnly,
  bulkUploadEmployees
);

export default router;