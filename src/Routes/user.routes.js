import express from "express";
import UserController from "../Controllers/user.controller.js";
import VerifyMiddleware from "../Middleware/verify.middleware.js";
import StatisticsController from "../Controllers/statistics.controller.js";
import ConferenceController from "../Controllers/conference.controller.js";

const router = express.Router();

router.get("/getuseralreadyinroom", UserController.getUserAlreadyConnected);
router.get("/getuserdetail", UserController.getUserDetail);
router.get("/listparticipants", UserController.listParticipants);
router.post("/generate", VerifyMiddleware.middlewareVerifyToken, UserController.generateUser);
router.post("/joingenerate", VerifyMiddleware.middlewareVerifyTokenJoinConference, UserController.generateUserJoin);
router.post("/generateChatUser", UserController.generateChatUser);
router.post("/updateparticipants", UserController.updateParticipants);
router.post("/mutepublishedtrack", UserController.mutePublishedTrack);
router.post("/removeParticipant", UserController.removeParticipant);
router.get("/log", StatisticsController.user);

// handleVideo
router.put("/handle/track", ConferenceController.handleTrack);

export default router;
