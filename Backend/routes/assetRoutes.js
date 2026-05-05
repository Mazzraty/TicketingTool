import express from "express";
import {
  assignAsset,
  returnAsset,
  getEmployeeHistory,
  getAssetHistory,
} from "../controllers/assetController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 ASSIGN (Admin only)
router.post("/assign", protect, adminOnly, assignAsset);

// 🔥 RETURN (Admin only)
router.post("/return", protect, adminOnly, returnAsset);

// 🔥 EMPLOYEE HISTORY
router.get("/employee/:id", protect, getEmployeeHistory);

// 🔥 ASSET HISTORY
router.get("/asset/:code", protect, getAssetHistory);

export default router;