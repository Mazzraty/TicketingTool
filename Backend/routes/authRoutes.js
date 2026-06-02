import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMyProfile,
  updateProfile,
  changePassword
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// PROFILE
router.get("/me", protect, getMyProfile);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;