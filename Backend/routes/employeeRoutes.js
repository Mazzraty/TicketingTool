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

// ----------------------
// BULK UPLOAD (PUT FIRST)
// ----------------------
router.post("/bulk-upload", protect, adminOnly, bulkUploadEmployees);

// ----------------------
// NORMAL ROUTES
// ----------------------
router.get("/", protect, adminOnly, getEmployees);
router.get("/:id", protect, getEmployee);

router.put("/:id", protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

export default router;