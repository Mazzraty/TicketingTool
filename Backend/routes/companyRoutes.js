import express from "express";
import {
  getCompanies,
  createCompany,getPublicCompanies
} from "../controllers/companyController.js";

import {
  protect,
  roleCheck
} from "../middleware/authMiddleware.js";

const router = express.Router();

// routes/companyRoutes.js
router.get("/public", getPublicCompanies);       
router.get("/", protect, getCompanies);          
router.post("/", protect, roleCheck("super_admin"), createCompany);

export default router;