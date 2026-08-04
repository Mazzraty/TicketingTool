import express from "express";

import {
  createTicket,
  createManualTicket,
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
  escalateTicket
} from "../controllers/ticketController.js";


import {
  protect,
  adminOnly,
  companyCheck,
} from "../middleware/authMiddleware.js";


import { upload } from "../middleware/upload.js";


const router = express.Router();


// ======================================================
// IT SUPPORT ACCESS MIDDLEWARE
// ======================================================

const supportOnly = (req, res, next) => {

  if (
    req.user.role === "it_support" ||
    req.user.role === "company_admin" ||
    req.user.role === "super_admin"
  ) {
    return next();
  }


  return res.status(403).json({
    success: false,
    message: "Access denied",
  });

};



// ======================================================
// ADMIN STATS (COMPANY ISOLATED)
// ======================================================

router.get(
  "/stats",
  protect,
  companyCheck,
  adminOnly,
  getTicketStats
);




// ======================================================
// USER ROUTES (COMPANY ISOLATED)
// ======================================================


// CREATE USER TICKET

router.post(
  "/",
  protect,
  companyCheck,
  upload.array("files", 5),
  createTicket
);



// USER MY TICKETS

router.get(
  "/my",
  protect,
  companyCheck,
  getUserTickets
);




// ======================================================
// IT SUPPORT MANUAL TICKET
// ======================================================


// CREATE MANUAL TICKET

router.post(
  "/manual",
  protect,
  companyCheck,
  supportOnly,
  createManualTicket
);





// ======================================================
// REVIEW / CONFIRM / REOPEN
// ======================================================


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





// ======================================================
// COMMON ROUTES
// ======================================================


// GET SINGLE TICKET

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





// ======================================================
// ADMIN ROUTES
// ======================================================


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

router.put(
  "/:id/escalate",
  protect,
  companyCheck,
  supportOnly,
  escalateTicket
);

export default router;