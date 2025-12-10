import express from "express";
import StatisticsController from "../Controllers/statistics.controller.js";

const router = express.Router();

router.get("/summary", StatisticsController.getStatsSummary);
router.get("/device", StatisticsController.getStatsDevice);
router.get("/type", StatisticsController.getStatsTypeSMS);
router.get("/gen", StatisticsController.generate);
router.get("/generate", StatisticsController.generate);
router.get("/user", StatisticsController.user);
router.get("/case", StatisticsController.user);

export default router;
