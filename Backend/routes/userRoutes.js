import express from "express";
import { getUsersByCompany } from "../controllers/userController.js";
import { protect, roleCheck } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   🟡 USERS BY COMPANY
========================= */
router.get(
  "/company/:companyId",
  protect,
  roleCheck("it_support", "super_admin"),
  getUsersByCompany
);
router.get(
  "/company/:companyId",
  protect,
  getUsersByCompany
);

export default router;