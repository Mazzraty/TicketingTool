// routes/softwareRoutes.js

import express from "express";

import {
  createSoftware,
  getSoftwares,
  getSoftwareById,
  updateSoftware,
  deleteSoftware,
  getDashboardStats,
} from "../controllers/softwareController.js";

const router = express.Router();

/* CRUD */
router.post("/", createSoftware);

router.get("/", getSoftwares);

router.get("/dashboard", getDashboardStats);

router.get("/:id", getSoftwareById);

router.put("/:id", updateSoftware);

router.delete("/:id", deleteSoftware);

export default router;