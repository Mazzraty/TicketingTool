import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMyProfile
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ✅ Profile route
router.get("/me", protect, getMyProfile);

export default router;