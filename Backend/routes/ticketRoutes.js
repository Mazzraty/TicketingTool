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

import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";

import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ======================================================
   🔥 ADMIN STATS
====================================================== */
router.get(
  "/stats",
  protect,
  companyCheck,
  adminOnly,
  getTicketStats
);

/* ======================================================
   👤 USER ROUTES (COMPANY ISOLATED)
====================================================== */

// CREATE TICKET
router.post(
  "/",
  protect,
  companyCheck,
  upload.array("files", 5),
  createTicket
);

// MY TICKETS
router.get(
  "/my",
  protect,
  companyCheck,
  getUserTickets
);

// REVIEW TICKET
router.put(
  "/:id/review",
  protect,
  companyCheck,
  addReview
);

// CONFIRM RESOLUTION
router.put(
  "/:id/confirm",
  protect,
  companyCheck,
  confirmResolution
);

// REOPEN TICKET
router.put(
  "/:id/reopen",
  protect,
  companyCheck,
  reopenTicket
);

/* ======================================================
   🛠️ COMMON (USER + ADMIN SAFE)
====================================================== */

// SINGLE TICKET
router.get(
  "/:id",
  protect,
  companyCheck,
  getTicketById
);

// EDIT TICKET
router.put(
  "/:id/edit",
  protect,
  companyCheck,
  upload.array("files", 5),
  editTicket
);

// DELETE ATTACHMENT
router.put(
  "/:id/delete-attachment",
  protect,
  companyCheck,
  deleteAttachment
);

/* ======================================================
   👑 ADMIN ROUTES (COMPANY SCOPED)
====================================================== */

// GET ALL TICKETS
router.get(
  "/",
  protect,
  companyCheck,
  adminOnly,
  getAllTickets
);

// UPDATE STATUS
router.put(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  updateStatus
);

// DELETE TICKET
router.delete(
  "/:id",
  protect,
  companyCheck,
  adminOnly,
  deleteTicket
);

export default router;