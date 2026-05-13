import express from "express";

import {
  createAsset,
  getAssets,
  assignAsset,
  returnAsset,
  updateAsset,
  deleteAsset,
  getEmployeeHistory,
  getAssetHistory,
} from "../controllers/assetController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   📦 ASSET MASTER
========================= */
router.post("/", protect, adminOnly, createAsset);
router.get("/", protect, adminOnly, getAssets);

/* =========================
   🔥 ASSIGN / RETURN
========================= */
router.post("/assign", protect, adminOnly, assignAsset);
router.post("/return", protect, adminOnly, returnAsset);

/* =========================
   ✏️ UPDATE / DELETE
========================= */
router.put("/:id", protect, adminOnly, updateAsset);
router.delete("/:id", protect, adminOnly, deleteAsset);

/* =========================
   👨 EMPLOYEE HISTORY
========================= */
router.get("/employee/:id", protect, getEmployeeHistory);

/* =========================
   💻 ASSET HISTORY
========================= */
router.get("/asset/:code", protect, getAssetHistory);

export default router;