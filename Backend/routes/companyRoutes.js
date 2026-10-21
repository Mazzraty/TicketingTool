// routes/companyRoutes.js
import express from "express";
import {
  getCompanies,
  getPublicCompanies,
  createCompany,
} from "../controllers/companyController.js";

import { protect, roleCheck } from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC: registration dropdown (id + name only).
// Keep this ABOVE any "/:id" route.
router.get("/public", getPublicCompanies);

// LOGGED-IN: scoped by role
router.get("/", protect, getCompanies);

// SUPER ADMIN ONLY
router.post("/", protect, roleCheck("super_admin"), createCompany);

export default router;