import express from "express";
import IDEMSController from "../Custom/idems.controller.js";

const router = express.Router();

router.post("/link/idems", IDEMSController.linkIDEMSCreate);

export default router;
