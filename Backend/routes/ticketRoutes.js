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
  confirmResolution,
  deleteAttachment,
} from "../controllers/ticketController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ======================================================
   🔥 IMPORTANT: ADMIN STATS (MUST BE FIRST)
====================================================== */
router.get(
  "/stats",
  protect,
  adminOnly,
  getTicketStats
);

/* ======================================================
   👤 USER ROUTES
====================================================== */

// CREATE TICKET
router.post(
  "/",
  protect,
  upload.array("files", 5),
  createTicket
);

// MY TICKETS
router.get(
  "/my",
  protect,
  getUserTickets
);

// SINGLE TICKET
router.get(
  "/:id",
  protect,
  getTicketById
);

// EDIT TICKET
router.put(
  "/:id/edit",
  protect,
  upload.array("files", 5),
  editTicket
);

// DELETE ATTACHMENT
router.put(
  "/:id/delete-attachment",
  protect,
  deleteAttachment
);

// REVIEW TICKET
router.put(
  "/:id/review",
  protect,
  addReview
);

// CONFIRM RESOLUTION (USER)
router.put(
  "/:id/confirm",
  protect,
  confirmResolution
);

// REOPEN TICKET
router.put(
  "/:id/reopen",
  protect,
  reopenTicket
);

/* ======================================================
   🛠️ ADMIN ROUTES
====================================================== */

// GET ALL TICKETS
router.get(
  "/",
  protect,
  adminOnly,
  getAllTickets
);

// UPDATE STATUS
router.put(
  "/:id",
  protect,
  adminOnly,
  updateStatus
);

// DELETE TICKET
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteTicket
);

export default router;