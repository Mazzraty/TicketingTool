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
   (PUBLIC FOR REGISTRATION)
========================= */
router.get("/", getCompanies);

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