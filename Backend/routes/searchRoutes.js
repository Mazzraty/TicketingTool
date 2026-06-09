import express from "express";
import { searchAll } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, searchAll);

export default router;