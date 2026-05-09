import express from "express";
import {
  bulkUploadEmployees,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
} from "../controllers/emplyeeController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/bulk-upload", protect, adminOnly, bulkUploadEmployees);

router.get("/", protect, adminOnly, getEmployees);
router.get("/:id", protect, getEmployee);

router.put("/:id", protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

export default router;