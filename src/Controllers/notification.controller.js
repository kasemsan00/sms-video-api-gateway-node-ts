import notificationService from "../Services/notification.service.js";
import logger from "../../logger.js";
import { EventEmitter } from "events";

// Global event emitter สำหรับ SSE (ใช้สำหรับ local events)
const notificationEventEmitter = new EventEmitter();

// เก็บ response objects ของ SSE clients
const sseClients = new Set();

/**
 * SSE endpoint สำหรับ notification events (Proxy to notification service)
 */
const notificationEvents = async (req, res) => {
  try {
    logger.info("New SSE client connected for notifications via gateway");

    // ตั้งค่า SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // เพิ่ม client ใน set
    sseClients.add(res);

    // สร้าง connection ไปยัง notification service SSE
    const notificationServiceURL = notificationService.NOTIFICATION_SERVICE_URL;
    const sseURL = `${notificationServiceURL}/api/notifications/events`;

    try {
      const response = await fetch(sseURL, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to notification service: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // ส่ง connection success message
      res.write(
        `data: ${JSON.stringify({
          type: "gateway_connected",
          message: "Connected to notification service via gateway",
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );

      // อ่านและ forward ข้อมูลจาก notification service
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              logger.info("Notification service SSE stream ended");
              break;
            }

            const chunk = decoder.decode(value);

            // Forward ข้อมูลไปยัง client โดยตรง
            if (!res.destroyed) {
              res.write(chunk);
            } else {
              break;
            }
          }
        } catch (error) {
          logger.error("Error reading from notification service SSE:", error);
          if (!res.destroyed) {
            res.write(
              `data: ${JSON.stringify({
                type: "error",
                message: "Lost connection to notification service",
                timestamp: new Date().toISOString(),
              })}\n\n`,
            );
          }
        }
      };

      readStream();
    } catch (error) {
      logger.error("Error connecting to notification service SSE:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Failed to connect to notification service",
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
    }

    // Cleanup เมื่อ client disconnect
    req.on("close", () => {
      logger.info("SSE client disconnected from gateway");
      sseClients.delete(res);
    });

    req.on("error", (error) => {
      logger.error("SSE client error in gateway:", error);
      sseClients.delete(res);
    });
  } catch (error) {
    logger.error("Error in notification SSE gateway endpoint:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

/**
 * Update notification read status (Proxy to notification service)
 */
const updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { read } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    if (read === undefined || read === null) {
      return res.status(400).json({
        success: false,
        message: "Read status is required",
      });
    }

    // เรียก notification service
    const updateResult = await notificationService.updateNotificationReadStatus(parseInt(notificationId), parseInt(read));

    // ดึงข้อมูล notification ที่อัพเดทแล้ว
    const updatedNotification = await notificationService.getNotificationById(parseInt(notificationId));

    logger.info(`Notification ${notificationId} updated via gateway`);

    res.json({
      success: true,
      message: "Notification updated successfully",
      data: updateResult,
      notification: updatedNotification,
    });
  } catch (error) {
    logger.error("Error updating notification via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification",
    });
  }
};

/**
 * Get unread notifications (Proxy to notification service)
 */
const getUnreadNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await notificationService.getUnreadNotifications(limit);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      timestamp: new Date().toISOString(),
      via: "gateway",
    });
  } catch (error) {
    logger.error("Error getting unread notifications via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notifications",
    });
  }
};

/**
 * Get notifications with pagination (Proxy to notification service)
 */
const getNotifications = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      read: req.query.read !== undefined ? parseInt(req.query.read) : null,
      notificationType: req.query.notificationType || null,
      userName: req.query.userName || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };

    const result = await notificationService.getNotifications(options);

    res.json({
      ...result,
      via: "gateway",
    });
  } catch (error) {
    logger.error("Error getting notifications via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notifications",
    });
  }
};

/**
 * Get notification by ID (Proxy to notification service)
 */
const getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification = await notificationService.getNotificationById(parseInt(notificationId));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      data: notification,
      via: "gateway",
    });
  } catch (error) {
    logger.error("Error getting notification by ID via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notification",
    });
  }
};

/**
 * Create new notification (Proxy to notification service)
 */
const createNotification = async (req, res) => {
  try {
    const notificationData = req.body;

    // Basic validation
    if (!notificationData.message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const result = await notificationService.createNotification(notificationData);

    logger.info(`New notification created via gateway`);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: result,
      via: "gateway",
    });
  } catch (error) {
    logger.error("Error creating notification via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create notification",
    });
  }
};

/**
 * Get notification service statistics (Proxy to notification service)
 */
const getStats = async (req, res) => {
  try {
    const serviceStats = await notificationService.getServiceStats();

    const gatewayStats = {
      gateway: {
        activeSSEConnections: sseClients.size,
        timestamp: new Date().toISOString(),
        service: "api-node-backend-gateway",
      },
      notificationService: serviceStats,
    };

    res.json({
      success: true,
      data: gatewayStats,
    });
  } catch (error) {
    logger.error("Error getting stats via gateway:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get stats",
    });
  }
};

export default {
  notificationEvents,
  updateNotification,
  getUnreadNotifications,
  getNotifications,
  getNotificationById,
  createNotification,
  getStats,
};
