import express from "express";
import RoomController from "../Controllers/room.controller.js";
import FileController from "../Controllers/file.controller.js";
import VerifyMiddleware from "../Middleware/verify.middleware.js";

const router = express.Router();

router.get("/detail", RoomController.getRoomDetail);
router.get("/listrooms", RoomController.listRooms);
router.get("/checkexpired", RoomController.closeExpired);
router.get("/verifytoken", RoomController.verifyToken);
router.get("/picture", FileController.filePicture);
router.post("/updateuser", RoomController.updateUser);
router.post("/deleteroom", RoomController.deleteRoom);
router.put("/updatetype", RoomController.updateRoomType);
router.put("/updatestatus", RoomController.updateRoomStatus);
router.put("/close", RoomController.closeRoom);
router.post("/verifyuser", VerifyMiddleware.middlewareVerifyToken, RoomController.verifyUser);

export default router;
