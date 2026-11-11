// routes/taskRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAssignees,
  createTask,
  getTasks,
  getTask,
  respondTask,
  saveMaterials,
  addDailyUpdate,
  closeTask,
  deleteTaskPhoto, // add this export to taskController.js
} from "../controllers/taskController.js";

const router = express.Router();

/* Closing attachments -> uploads/tasks
   pictures + Excel / CSV / PDF, 10 MB each, max 5 files */
const uploadDir = path.join(process.cwd(), "uploads", "tasks");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|bmp|xlsx|xls|csv|pdf)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  // Extension check, not mimetype: browsers report Excel/CSV mimetypes inconsistently
  fileFilter: (req, file, cb) =>
    ALLOWED_EXT.test(file.originalname)
      ? cb(null, true)
      : cb(new Error("File type not allowed (pictures, Excel, CSV or PDF only)")),
});

// Upload errors (too big, too many, wrong type) become a clear 400 instead of a 500
const uploadAttachments = (req, res, next) =>
  upload.array("photos", 5)(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File too large (max 10 MB each)"
      : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "Max 5 files"
      : err.message || "Upload failed";
    res.status(400).json({ message });
  });

router.use(protect);

router.get("/assignees", getAssignees); // must be above "/:id"
router.get("/", getTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.post("/:id/respond", respondTask); // IT support accepts / rejects
router.put("/:id/materials", saveMaterials);
router.post("/:id/daily", addDailyUpdate);
router.post("/:id/close", uploadAttachments, closeTask);
router.delete("/:id/photos", deleteTaskPhoto); // Super Admin deletes a saved file

export default router;