import logger from "../../logger.js";

// Configuration สำหรับ notification service
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3001";

/**
 * HTTP client สำหรับเรียก notification service
 */
class NotificationServiceClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Error calling notification service at ${url}:`, error);
      throw error;
    }
  }
}

const notificationClient = new NotificationServiceClient(NOTIFICATION_SERVICE_URL);

/**
 * Get unread notifications
 * @param {number} limit - Limit number of notifications
 * @returns {Promise<Array>} Array of unread notifications
 */
const getUnreadNotifications = async (limit = 50) => {
  try {
    const response = await notificationClient.makeRequest(`/api/notifications/unread?limit=${limit}`);
    return response.data || [];
  } catch (error) {
    logger.error("Error getting unread notifications from service:", error);
    throw error;
  }
};

/**
 * Update notification read status
 * @param {number} notificationId - Notification ID to update
 * @param {number} readStatus - Read status (0 = unread, 1 = read)
 * @returns {Promise<Object>} Update result
 */
const updateNotificationReadStatus = async (notificationId, readStatus = 1) => {
  try {
    const response = await notificationClient.makeRequest(`/api/notifications/${notificationId}`, {
      method: "PUT",
      body: { read: readStatus },
    });

    return response.data || response;
  } catch (error) {
    logger.error("Error updating notification read status:", error);
    throw error;
  }
};

/**
 * Get notification by ID
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Notification data
 */
const getNotificationById = async (notificationId) => {
  try {
    const response = await notificationClient.makeRequest(`/api/notifications/${notificationId}`);
    return response.data || null;
  } catch (error) {
    logger.error("Error getting notification by ID:", error);
    throw error;
  }
};

/**
 * Create new notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const response = await notificationClient.makeRequest("/api/notifications", {
      method: "POST",
      body: notificationData,
    });

    return response.data || response;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get notifications with pagination and filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated notifications
 */
const getNotifications = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });

    const response = await notificationClient.makeRequest(`/api/notifications?${queryParams.toString()}`);
    return response;
  } catch (error) {
    logger.error("Error getting notifications:", error);
    throw error;
  }
};

/**
 * Get notification service statistics
 * @returns {Promise<Object>} Service statistics
 */
const getServiceStats = async () => {
  try {
    const response = await notificationClient.makeRequest("/api/notifications/service/stats");
    return response.data || response;
  } catch (error) {
    logger.error("Error getting service stats:", error);
    throw error;
  }
};

export default {
  getUnreadNotifications,
  updateNotificationReadStatus,
  getNotificationById,
  createNotification,
  getNotifications,
  getServiceStats,
  // Export client สำหรับใช้งานขั้นสูง
  client: notificationClient,
  NOTIFICATION_SERVICE_URL,
};
