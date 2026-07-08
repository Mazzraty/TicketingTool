import express from "express";

import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMyProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import {
  protect,
  roleCheck,
} from "../middleware/authMiddleware.js";
import { getUsersByCompany } from "../controllers/userController.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =========================
   AUTH (PUBLIC)
========================= */
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password", resetPassword);

/* =========================
   REGISTER (PUBLIC + ADMIN)
========================= */
router.post("/register", register);

/* =========================
   PROFILE (GLOBAL USER DATA)
========================= */
router.get(
  "/me",
  protect,
  getMyProfile
);

router.put(
  "/update-profile",
  protect,
  updateProfile
);

router.put(
  "/change-password",
  protect,
  changePassword
);

router.get(
  "/users/company/:companyId",
  protect,
  roleCheck("it_support", "super_admin"),
  getUsersByCompany
);
export default router;