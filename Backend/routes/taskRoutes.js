// routes/taskRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { protect } from "../middleware/authMiddleware.js"; // <-- adjust to your auth middleware
import {
  getAssignees,
  createTask,
  getTasks,
  getTask,
  saveMaterials,
  addDailyUpdate,
  closeTask,
} from "../controllers/taskController.js";

const router = express.Router();

/* Closing photos -> uploads/tasks (images only, 5 MB each, max 5 files) */
const uploadDir = path.join(process.cwd(), "uploads", "tasks");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files are allowed")),
});

router.use(protect);

router.get("/assignees", getAssignees); // must be above "/:id"
router.get("/", getTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.put("/:id/materials", saveMaterials);
router.post("/:id/daily", addDailyUpdate);
router.post("/:id/close", upload.array("photos", 5), closeTask);

export default router;