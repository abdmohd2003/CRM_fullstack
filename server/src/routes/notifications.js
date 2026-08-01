const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/auth.middleware");

// All notification routes require authentication
router.use(protect);

// Get notification types (for filtering)
router.get("/types", notificationController.getNotificationTypes);

// Get unread count only
router.get("/unread-count", notificationController.getUnreadCount);

// Get all notifications for user
router.get("/", notificationController.getNotifications);

// Mark all as read
router.patch("/mark-all-read", notificationController.markAllAsRead);

// Delete all read notifications
router.delete("/clear-read", notificationController.deleteReadNotifications);

// Delete all notifications (admin only)
router.delete("/clear-all", notificationController.deleteAllNotifications);

// Get, update, delete single notification
router.route("/:id")
  .get(notificationController.getNotificationById)
  .patch(notificationController.markAsRead)
  .delete(notificationController.deleteNotification);

// Internal: Create notification (system use)
router.post("/", notificationController.createNotification);

module.exports = router;