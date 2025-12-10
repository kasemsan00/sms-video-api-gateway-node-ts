import SystemService from "../Services/system.service.js";
import RoomService from "../Services/room.service.js";

const getService = async (req, res) => {
  const { service } = req.query;
  const resp = await SystemService.getService({ service });
  if (resp === null) {
    res.status(404).send("Invalid service");
    return;
  }
  const url = resp.logo && resp.logo.trim() ? `${process.env.API_URL}/logo/${resp.logo.trim()}` : "";

  resp.logo = url;
  res.json(resp);
};

const getServiceByRoom = async (req, res) => {
  try {
    const { room } = req.query;
    if (!room) {
      return res.status(400).json({ error: "Room parameter is required" });
    }
    const serviceId = await RoomService.getServiceId({ room });
    if (!serviceId) {
      return res.status(404).json({ error: "Room not found or has no associated service" });
    }
    const resp = await SystemService.getService({ service: serviceId });
    if (resp === null) {
      return res.status(404).json({ error: "Service not found" });
    }
    const url = resp.logo && resp.logo.trim() ? `${process.env.API_URL}/logo/${resp.logo.trim()}` : "";
    resp.logo = url;
    return res.json(resp);
  } catch (error) {
    console.error("Error in getServiceByRoom:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateService = async (req, res) => {
  const { service, name, latitude, longitude } = req.body;
  if (!service || !latitude || !longitude) {
    return res.status(400).json({ error: "Service and location parameters are required" });
  }
  const resp = await SystemService.updateService({ service, name, latitude, longitude });
  if (resp) {
    res.json({ message: "Service updated successfully" });
  } else {
    console.error(resp);
    res.status(500).json({ error: "Failed to update service location" });
  }
};

export default {
  getService,
  getServiceByRoom,
  updateService,
};
