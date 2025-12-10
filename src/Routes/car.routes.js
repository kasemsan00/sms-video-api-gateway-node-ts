import express from "express";
import CarController from "../Controllers/car.controller.js";
const router = express.Router();

router.get("/task", CarController.getTaskDetailController);
router.put("/task", CarController.updateTask);
router.post("/task", CarController.createTask);

router.get("/list", CarController.getTaskList);

export default router;
