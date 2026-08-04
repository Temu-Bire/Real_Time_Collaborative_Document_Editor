const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../../auth/middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);

module.exports = router;
