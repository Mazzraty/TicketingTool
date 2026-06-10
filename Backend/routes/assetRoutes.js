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
  getMyAssets,
} from "../controllers/assetController.js";

import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";

import {
  bulkUploadEmployees,
} from "../controllers/emplyeeController.js";

const router = express.Router();

/* =========================
   👤 USER SIDE
========================= */
router.get(
  "/my-assets",
  protect,
  companyCheck,
  getMyAssets
);

/* =========================
   🏢 ASSET MASTER (ADMIN ONLY)
========================= */
router.post(
  "/",
  protect,
  adminOnly,
  companyCheck,
  createAsset
);

router.get(
  "/",
  protect,
  adminOnly,
  companyCheck,
  getAssets
);

/* =========================
   🔁 ASSIGN / RETURN
========================= */
router.post(
  "/assign",
  protect,
  adminOnly,
  companyCheck,
  assignAsset
);

router.post(
  "/return",
  protect,
  adminOnly,
  companyCheck,
  returnAsset
);

/* =========================
   ✏️ UPDATE / DELETE
========================= */
router.put(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  updateAsset
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  companyCheck,
  deleteAsset
);

/* =========================
   📊 HISTORY (READ ONLY)
========================= */
router.get(
  "/employee/:id",
  protect,
  companyCheck,
  getEmployeeHistory
);

router.get(
  "/asset/:code",
  protect,
  companyCheck,
  getAssetHistory
);

/* =========================
   📦 BULK UPLOAD
========================= */
router.post(
  "/bulk-upload",
  protect,
  adminOnly,
  companyCheck,
  bulkUploadEmployees
);

export default router;