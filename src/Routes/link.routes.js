import express from "express";
import LinkController from "../Controllers/link.controller.js";
import VerifyMiddleware from "../Middleware/verify.middleware.js";
import StatisticsController from "../Controllers/statistics.controller.js";

const router = express.Router();

router.get("/getdetail", LinkController.getLinkDetail);
router.get("/history", LinkController.history);
router.post("/create", VerifyMiddleware.middlewareVerifyToken, LinkController.linkCreate);
router.post("/create/hls", LinkController.createLinkHLS);
router.post("/update/latlng", LinkController.updateLatLngLinkDetail);
router.post("/multilatlng/send", LinkController.multiLatlng);
router.get("/share", LinkController.getShareURL);
router.post("/cartracking", LinkController.linkWatchPosition);
router.get("/get/domain", LinkController.getDomain);
router.get("/list", StatisticsController.getStatsSummary);

export default router;
