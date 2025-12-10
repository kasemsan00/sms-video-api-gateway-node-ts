import express from "express";
import RadioController from "../Controllers/radio.controller.js";

const router = express.Router();

// Device endpoints
router.get("/device", RadioController.getDevice);
router.get("/device/:id", RadioController.getDeviceById);

// Location endpoints
router.get("/location", RadioController.getLocations);
router.get("/location/:radioNo", RadioController.getLocationByRadioNo);

export default router;
