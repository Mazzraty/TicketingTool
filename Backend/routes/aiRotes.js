import express from "express";
import { askAI, getTicketRecommendation } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ask", protect, askAI);
router.post("/ticket-recommendation", protect, getTicketRecommendation);

export default router;