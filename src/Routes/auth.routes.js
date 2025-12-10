import express from "express";
import AuthController from "../Controllers/auth.controller.js";

const router = express.Router();

router.get("/create", AuthController.createToken);
router.post("/verifyuser", AuthController.verifyJoinUserWithPassword);

export default router;
