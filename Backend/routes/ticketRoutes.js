import express from "express";
import {
  createTicket,
  getAllTickets,
  getUserTickets,
  sendTestEmail,
  updateStatus,
  deleteTicket,
  getTicketStats,
} from "../controllers/ticketController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// ==========================
// ✅ USER ROUTES
// ==========================

// Create ticket (with file upload limit)
router.post(
  "/",
  protect,
  upload.array("files", 5), // ✅ limit 5 files
  createTicket
);

// Get logged-in user tickets
router.get("/my", protect, getUserTickets);

// Send a protected deployment test email
router.get("/test-email", protect, sendTestEmail);

// Get single ticket (for view page)
// router.get("/:id", protect, getTicketById); // ✅ COMMENTED OUT - function doesn't exist


// ==========================
// ✅ ADMIN ROUTES
// ==========================

// Stats (MUST come before /:id to avoid conflict)
router.get("/stats", protect, adminOnly, getTicketStats);

// Get all tickets (pagination)
router.get("/", protect, adminOnly, getAllTickets);

// Update ticket status
router.put("/:id", protect, adminOnly, updateStatus);

// Delete ticket
router.delete("/:id", protect, adminOnly, deleteTicket);


export default router;