import express from "express";
import {
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  bulkUploadEmployees
} from "../controllers/emplyeeController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET
router.get("/", protect, adminOnly, getEmployees);
router.get("/:id", protect, getEmployee);

// UPDATE / DELETE
router.put("/:id", protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

// 🔥 BULK UPLOAD (FIXED)
router.post("/bulk-upload", protect, adminOnly, bulkUploadEmployees);

export default router;