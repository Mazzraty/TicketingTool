import { getMyNotifications,markAsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/notifications", protect, getMyNotifications);
router.put("/notifications/:id/read", protect, markAsRead);
export default router;