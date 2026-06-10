import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMyProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import {
  protect,
  roleCheck,
  companyCheck,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   AUTH (PUBLIC)
========================= */
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/* =========================
   REGISTER (ADMIN CONTROLLED)
========================= */
router.post(
  "/register",
  protect,
  roleCheck("company_admin", "super_admin", "it_support"),
  companyCheck,
  register
);

/* =========================
   PROFILE (SECURED SAAS)
========================= */
router.get(
  "/me",
  protect,
  companyCheck,
  getMyProfile
);

router.put(
  "/update-profile",
  protect,
  companyCheck,
  updateProfile
);

router.put(
  "/change-password",
  protect,
  companyCheck,
  changePassword
);

export default router;