import express from "express";
import FileController from "../Controllers/file.controller.js";
import FileMiddleware from "../Middleware/file.middleware.js";

const router = express.Router();

router.post("/file", FileMiddleware.uploadFile.array("myFiles"), FileMiddleware.fileSizeLimitErrorHandler, FileController.uploadFile);
router.post("/video", FileMiddleware.uploadRecord.single("myVideo"), FileMiddleware.getVideoDuration, FileController.uploadVideo);
router.get("/list", FileController.videoList);

export default router;
