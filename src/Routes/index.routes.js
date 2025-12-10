import express from "express";
import roomRoutes from "./room.routes.js";
import userRoutes from "./user.routes.js";
import linkRoutes from "./link.routes.js";
import caseRoutes from "./case.routes.js";
import statsRoutes from "./stats.routes.js";
import recordRoutes from "./record.routes.js";
import chatRoutes from "./chat.routes.js";
import authRoutes from "./auth.routes.js";
import uploadRoutes from "./upload.routes.js";
import radioRoutes from "./radio.routes.js";
import carRoute from "./car.routes.js";
import serviceRoutes from "./service.routes.js";
import notificationRoutes from "./notification.routes.js";
import testController from "../Controllers/test.controller.js";
import logController from "../Controllers/log.controller.js";
import StatusController from "../Controllers/status.controller.js";
import LinkController from "../Controllers/link.controller.js";
import WebhookController from "../Controllers/webhook.controller.js";
import ServiceController from "../Controllers/service.controller.js";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = express.Router();

// Mount route modules
router.use("/room", roomRoutes);
router.use("/user", userRoutes);
router.use("/link", linkRoutes);
router.use("/case", caseRoutes);
router.use("/stats", statsRoutes);
router.use("/record", recordRoutes);
router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);
router.use("/upload", uploadRoutes);
router.use("/car", carRoute);
router.use("/radio", radioRoutes);
router.use("/service", serviceRoutes);
router.use("/notification", notificationRoutes);

// Individual routes
router.get("/test", testController.testUnMuteAll);
router.get("/test/get/namespace", testController.getAllNamespaces);
router.post("/log", logController.addLog);
router.get("/status", StatusController.getStatusUsage);
router.get("/service", ServiceController.getService);
router.post("/webhook", WebhookController.webHook);
router.post("/sms/custom", LinkController.sendCustomMessage);

// Namespace route
router.get("/namespace", (req, res) => {
  const namespaces = Array.from(global.io._nsps.keys());
  res.json(namespaces);
});

// Real-time service proxy configuration
const realtimeServiceProxy = createProxyMiddleware({
  target: process.env.REALTIME_SERVICE_URL || "http://localhost:3002",
  changeOrigin: true,
  ws: true, // Enable WebSocket proxy
  pathRewrite: {
    "^/api/realtime": "", // Remove /api/realtime prefix
  },
  onError: (err, req, res) => {
    console.error("Real-time service proxy error:", err);
    res.status(503).json({
      success: false,
      message: "Real-time service unavailable",
    });
  },
});

// Apply proxy to real-time service routes
router.use("/api/realtime/rooms", realtimeServiceProxy);
router.use("/api/realtime/chat", realtimeServiceProxy);
router.use("/api/realtime/presence", realtimeServiceProxy);
router.use("/api/realtime/socket.io", realtimeServiceProxy);

export default router;
