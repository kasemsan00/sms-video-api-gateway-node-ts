import express from "express";
import ChatController from "../Controllers/chat.controller.js";

const router = express.Router();

router.get("/history", ChatController.ChatHistory);
router.get("/notification", ChatController.Notification);

export default router;
