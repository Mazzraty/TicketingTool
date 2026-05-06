import express from "express";
import {
  createAsset,
  getAssets,
  assignAsset,
  returnAsset,
  getEmployeeHistory,
  getAssetHistory,bulkUploadAssets
} from "../controllers/assetController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ASSET CRUD
router.post("/", protect, adminOnly, createAsset);
router.get("/", protect, adminOnly, getAssets);

// ASSIGN / RETURN
router.post("/assign", protect, adminOnly, assignAsset);
router.post("/return", protect, adminOnly, returnAsset);

// HISTORY
router.get("/employee/:id", protect, getEmployeeHistory);
router.get("/asset/:code", protect, getAssetHistory);

router.post("/bulk-upload", protect, adminOnly, bulkUploadAssets);

export default router;