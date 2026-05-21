import express from "express";

import {
  createTicket,
  getAllTickets,
  getUserTickets,
  updateStatus,
  deleteTicket,
  getTicketStats,
  editTicket,
  addReview,
  getTicketById,
  reopenTicket,
} from "../controllers/ticketController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// ================= USER ROUTES =================

router.post("/", protect, upload.array("files", 5), createTicket);

router.get("/my", protect, getUserTickets);

router.put("/:id/edit", protect, upload.array("files", 5), editTicket);

router.put("/:id/review", protect, addReview);

router.put("/:id/reopen", protect, reopenTicket);


// ================= ADMIN ROUTES =================

router.get("/stats", protect, adminOnly, getTicketStats);

router.get("/", protect, adminOnly, getAllTickets);

router.put("/:id", protect, adminOnly, updateStatus);

router.delete("/:id", protect, adminOnly, deleteTicket);


// 🔥 ALWAYS LAST (VERY IMPORTANT)
router.get("/:id", protect, getTicketById);

export default router;