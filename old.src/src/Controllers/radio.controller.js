import request from "../Request/request.js";
import logger from "../../logger.js";
import radioService from "../Services/radio.service.js";
import tableService from "../Services/table.service.js";

const getDevice = async (req, res) => {
  try {
    const response = await request.getAllDevices();
    if (response.status === "1" && response.message === "Success") {
      const exists = await tableService.checkTableExists("radio_devices");
      if (!exists) {
        res.status(500).json({
          status: "ERROR",
          message: "Table does not exist",
          error: "Table does not exist",
        });
        return;
      }
      if (response.resultData === null) {
        res.json(response);
        return;
      }
      for (const device of response.resultData) {
        radioService.insertDevice({
          id: device.id,
          radioNo: device.radioNo,
          radioName: device.radioName,
          status: device.status,
          serialNo: device.serialNo,
        });
      }
    }
    res.json(response);
  } catch (error) {
    logger.error(`Error in getDevice: ${error.message}`);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch devices",
      error: error.message,
    });
  }
};

const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: "NOT FOUND",
        message: "Device ID is required",
      });
    }
    const response = await request.getDeviceById(id);
    const exists = await tableService.checkTableExists("radio_devices");
    if (!exists) {
      res.status(500).json({
        status: "ERROR",
        message: "Table does not exist",
        error: "Table does not exist",
      });
      return;
    }
    if (response.resultData === null) {
      res.json(response);
      return;
    }
    radioService.insertDevice({
      id: response.resultData.id,
      radioNo: response.resultData.radioNo,
      radioName: response.resultData.radioName,
      status: response.resultData.status,
      serialNo: response.resultData.serialNo,
    });
    res.json(response);
  } catch (error) {
    logger.error(`Error in getDeviceById: ${error.message}`);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch device",
      error: error.message,
    });
  }
};

const getLocations = async (req, res) => {
  try {
    const response = await request.getAllLocations();
    const exists = await tableService.checkTableExists("radio_locations");
    if (!exists) {
      res.status(500).json({
        status: "ERROR",
        message: "Table does not exist",
        error: "Table does not exist",
      });
      return;
    }
    if (response.resultData === null) {
      res.json(response);
      return;
    }
    for (const location of response.resultData) {
      radioService.insertLocation({
        logId: location.logId,
        id: location.id,
        radioNo: location.radioNo,
        radioName: location.radioName,
        accuracy: location.accuracy,
        gpsDateTime: location.gpsDateTime,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        emergency: location.emergency,
      });
    }
    res.json(response);
  } catch (error) {
    logger.error(`Error in getLocations: ${error.message}`);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch locations",
      error: error.message,
    });
  }
};

const getLocationByRadioNo = async (req, res) => {
  try {
    const { radioNo } = req.params;
    if (!radioNo) {
      return res.status(400).json({
        status: "NOT FOUND",
        message: "Radio number is required",
      });
    }
    const response = await request.getLocationByRadioNo(radioNo);
    const exists = await tableService.checkTableExists("radio_locations");
    if (!exists) {
      res.status(500).json({
        status: "ERROR",
        message: "Table does not exist",
        error: "Table does not exist",
      });
      return;
    }
    if (response.resultData === null) {
      res.json(response);
      return;
    }
    radioService.insertLocation({
      logId: response.resultData.logId,
      id: response.resultData.id,
      radioNo: response.resultData.radioNo,
      radioName: response.resultData.radioName,
      accuracy: response.resultData.accuracy,
      gpsDateTime: response.resultData.gpsDateTime,
      latitude: response.resultData.latitude,
      longitude: response.resultData.longitude,
      speed: response.resultData.speed,
      emergency: response.resultData.emergency,
    });
    res.json(response);
  } catch (error) {
    logger.error(`Error in getLocationByRadioNo: ${error.message}`);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch location for radio",
      error: error.message,
    });
  }
};

export default {
  getDevice,
  getDeviceById,
  getLocations,
  getLocationByRadioNo,
};
