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
} from "../middleware/authMiddleware.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =========================
   AUTH (PUBLIC)
========================= */
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

/* =========================
   REGISTER (PUBLIC + ADMIN)
========================= */
router.post("/register", asyncHandler(register));

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

export default router;