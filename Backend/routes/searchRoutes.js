import express from "express";
import { searchAll } from "../controllers/searchController.js";
import { protect, companyCheck } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  companyCheck,
  searchAll
);

export default router;