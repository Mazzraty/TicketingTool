import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { getTicketById } from "../controllers/ticketController.js";
import { getDepartmentChart, getTicketCategoryChart, getTicketPriorityChart, getTicketStatusChart, getTicketTrend } from "../controllers/adminTicketDashboardController.js";

const router = express.Router();

/* =========================
   TICKET DASHBOARD KPIs
========================= */
router.get("/kpis", protect, getTicketById);

/* =========================
   TICKET CHARTS
========================= */
router.get("/trend", protect, getTicketTrend);

router.get("/status", protect, getTicketStatusChart);

router.get("/priority", protect, getTicketPriorityChart);

router.get("/category", protect, getTicketCategoryChart);

router.get("/department", protect, getDepartmentChart);

export default router;