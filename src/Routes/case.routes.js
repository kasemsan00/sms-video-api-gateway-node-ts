import express from "express";
import CaseController from "../Controllers/case.controller.js";

const router = express.Router();

router.post("/create", CaseController.create);
router.get("/get", CaseController.getDetail);
router.get("/history", CaseController.getHistory);
router.put("/update", CaseController.update);

export default router;
