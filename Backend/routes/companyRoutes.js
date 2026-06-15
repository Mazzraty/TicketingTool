import express from "express";
import {
  getCompanies,
  createCompany
} from "../controllers/companyController.js";

import {
  protect,
  roleCheck
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   🔍 GET COMPANIES
   (SUPER ADMIN ONLY)
========================= */
router.get(
  "/",
  protect,
  roleCheck("super_admin"),
  getCompanies
);

/* =========================
   🏢 CREATE COMPANY
   (SUPER ADMIN ONLY)
========================= */
router.post(
  "/",
  protect,
  roleCheck("super_admin"),
  createCompany
);

export default router;