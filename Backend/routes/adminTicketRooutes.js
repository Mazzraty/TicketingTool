import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { getTicketKpis, getDepartmentChart, getTicketCategoryChart, getTicketPriorityChart, getTicketStatusChart, getTicketTrend, getAvgResolutionTime, getAvgFirstResponseTime } from "../controllers/adminTicketDashboardController.js";
import { getSlaPolicy } from "../controllers/adminTicketDashboardController.js";
const router = express.Router();

/* =========================
   TICKET DASHBOARD KPIs
========================= */
router.get("/kpis", protect, getTicketKpis);

/* =========================
   TICKET CHARTS
========================= */
router.get("/trend", protect, getTicketTrend);

router.get("/status", protect, getTicketStatusChart);

router.get("/priority", protect, getTicketPriorityChart);

router.get("/category", protect, getTicketCategoryChart);

router.get("/department", protect, getDepartmentChart);

router.get("/avg-resolution-time", protect, getAvgResolutionTime);
router.get("/avg-first-response-time", protect, getAvgFirstResponseTime);

router.get("/sla-policy", protect, getSlaPolicy);

export default router;