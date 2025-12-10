import express from "express";
import notificationController from "../Controllers/notification.controller.js";

const router = express.Router();

// Basic health check route
router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-routes-gateway" });
});

/**
 * SSE endpoint สำหรับ notification events (Gateway proxy to notification service)
 * GET /notification/events
 */
router.get("/events", notificationController.notificationEvents);

/**
 * Get unread notifications (shortcut)
 * GET /notification/unread?limit=50
 */
router.get("/unread", notificationController.getUnreadNotifications);

/**
 * Get gateway and service statistics
 * GET /notification/service/stats
 */
router.get("/service/stats", notificationController.getStats);

/**
 * Get notifications with pagination and filters
 * GET /notification?page=1&limit=50&read=0&notificationType=alert
 */
router.get("/", notificationController.getNotifications);

/**
 * Create new notification
 * POST /notification
 * Body: { userName, message, caseId, notificationType, relatedUrl }
 */
router.post("/", notificationController.createNotification);

/**
 * Update notification read status
 * PUT /notification/:notificationId
 * Body: { read: 0 | 1 }
 */
router.put("/:notificationId", notificationController.updateNotification);

/**
 * Legacy route for backward compatibility
 * PUT /notification/update/:notificationId
 */
router.put("/update/:notificationId", notificationController.updateNotification);

/**
 * Get notification by ID
 * GET /notification/:notificationId
 */
router.get("/:notificationId", notificationController.getNotificationById);

export default router;
