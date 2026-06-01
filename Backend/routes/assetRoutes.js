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
} from "../middleware/authMiddleware.js";

import {
   bulkUploadEmployees,
} from "../controllers/emplyeeController.js";

const router = express.Router();

/* =========================
   USER ASSETS
========================= */
router.get(
   "/my-assets",
   protect,
   getMyAssets
);

/* =========================
   ASSET MASTER
========================= */
router.post(
   "/",
   protect,
   adminOnly,
   createAsset
);

router.get(
   "/",
   protect,
   adminOnly,
   getAssets
);

/* =========================
   ASSIGN / RETURN
========================= */
router.post(
   "/assign",
   protect,
   adminOnly,
   assignAsset
);

router.post(
   "/return",
   protect,
   adminOnly,
   returnAsset
);

/* =========================
   UPDATE / DELETE
========================= */
router.put(
   "/:id",
   protect,
   adminOnly,
   updateAsset
);

router.delete(
   "/:id",
   protect,
   adminOnly,
   deleteAsset
);

/* =========================
   EMPLOYEE HISTORY
========================= */
router.get(
   "/employee/:id",
   protect,
   getEmployeeHistory
);

/* =========================
   ASSET HISTORY
========================= */
router.get(
   "/asset/:code",
   protect,
   getAssetHistory
);

/* =========================
   BULK UPLOAD
========================= */
router.post(
   "/bulk-upload",
   protect,
   adminOnly,
   bulkUploadEmployees
);

export default router;