import express from "express";
import RecordController from "../Controllers/record.controller.js";
import FileController from "../Controllers/file.controller.js";

const router = express.Router();

router.get("/request", RecordController.requestRecord);
router.get("/list", RecordController.listRecordTask);
router.get("/stopall", RecordController.stopAllRecordTask);
router.get("/file", FileController.fileHistoryRecord);
router.get("/check", RecordController.checkRecordAvailable);

export default router;
