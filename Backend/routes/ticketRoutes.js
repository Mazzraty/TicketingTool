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
  reopenTicket,   // ✅ REAL FIX
} from "../controllers/ticketController.js";

import {
  adminOnly,
  protect,
} from "../middleware/authMiddleware.js";

import { upload } from "../middleware/upload.js";

const router = express.Router();


// ======================================================
// ✅ USER ROUTES
// ======================================================

// CREATE TICKET
router.post(
  "/",
  protect,
  upload.array("files", 5),
  createTicket
);

// MY TICKETS
router.get("/my", protect, getUserTickets);

// GET SINGLE TICKET
router.get("/:id", protect, getTicketById);

// EDIT TICKET (OPEN / REOPEN ONLY)
router.put(
  "/:id/edit",
  protect,
  upload.array("files", 5),
  editTicket
);

// ADD REVIEW
router.put("/:id/review", protect, addReview);

// REOPEN TICKET (USER ONLY) ⭐ CLEAN & SAFE
router.put("/:id/reopen", protect, reopenTicket);


// ======================================================
// 🔥 ADMIN ROUTES
// ======================================================

// STATS
router.get("/stats", protect, adminOnly, getTicketStats);

// ALL TICKETS
router.get("/", protect, adminOnly, getAllTickets);

// UPDATE STATUS (ADMIN ONLY)
router.put("/:id", protect, adminOnly, updateStatus);

// DELETE
router.delete("/:id", protect, adminOnly, deleteTicket);


export default router;