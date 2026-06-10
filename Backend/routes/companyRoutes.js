import express from "express";
import { getCompanies, createCompany } from "../controllers/companyController.js";
import { protect, roleCheck } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCompanies);
router.post("/", protect, roleCheck("super_admin"), createCompany);

export default router;
