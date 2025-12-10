import logger from "../../logger.js";
import carController from "../Controllers/car.controller.js";
import carService from "../Services/car.service.js";

const initialSocket = async ({ io, namespace }) => {
  if (namespace === undefined || namespace === "undefined" || namespace === null || namespace === "null") {
    return;
  }

  const connections = io.of("/" + namespace);

  connections.use(async (socket, next) => {
    if (namespace === "mobile") {
      return next();
    }
  });

  connections.on("connection", async (socket) => {
    const id = socket.handshake.query.id || socket.handshake.query.task;

    logger.info("connection mobile task %s", id);

    if (id === undefined || id === "") {
      socket.emit("status", {
        status: "failed",
      });
      socket.emit("message", {
        message: "invalid task id",
      });
      socket.disconnect();
    }
    const resp = await carController.getTaskDetail({ uid: id });
    if (!resp) {
      socket.emit("status", {
        status: "failed",
      });
      socket.emit("message", {
        message: "invalid task id",
      });
      socket.disconnect();
    }

    socket.emit("message", {
      message: "connection success",
    });

    socket.emit("status", {
      status: "connection-success",
    });
    socket.emit("connection", resp);

    socket.on("disconnect", () => {
      logger.warn("mobile socket %s disconnect", socket.id);
    });

    socket.on("status", async (data) => {
      // console.log("status", data);
    });

    socket.on("location", (data) => {
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (error) {
          logger.error("Failed to parse location data:", error);
          return;
        }
      }
      carService.updateCarPositionByUid({
        uid: id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        altitude: data.altitude,
        altitudeAccuracy: data.altitudeAccuracy,
      });

      socket.emit("message", {
        message: "received location",
      });
    });
  });
};

const initMobileDataSocket = async () => {
  logger.info("init socket mobile");
  await initialSocket({
    io: global.io,
    namespace: "mobile",
  });
};

export default {
  initMobileDataSocket,
};
