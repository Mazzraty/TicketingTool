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
  getTicketById,   // ✅ ADD THIS
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

// CREATE
router.post(
  "/",
  protect,
  upload.array("files", 5),
  createTicket
);

// MY TICKETS
router.get("/my", protect, getUserTickets);


// VIEW SINGLE TICKET (🔥 IMPORTANT)
router.get("/:id", protect, getTicketById);

// REVIEW
router.put("/:id/review", protect, addReview);

// EDIT TICKET
router.put(
  "/:id/edit",
  protect,
  upload.array("files", 5),
  editTicket
);



// ======================================================
// ✅ ADMIN ROUTES
// ======================================================

// STATS
router.get("/stats", protect, adminOnly, getTicketStats);

// ALL TICKETS
router.get("/", protect, adminOnly, getAllTickets);

// UPDATE STATUS
router.put("/:id", protect, adminOnly, updateStatus);

// DELETE
router.delete("/:id", protect, adminOnly, deleteTicket);

export default router;