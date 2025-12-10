import express from "express";
import ServiceController from "../Controllers/service.controller.js";

const router = express.Router();

router.get("/get", ServiceController.getServiceByRoom);
router.put("/update", ServiceController.updateService);

export default router;
