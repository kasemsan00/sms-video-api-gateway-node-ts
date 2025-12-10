import logger from "../../logger.js";
import CarService from "../Services/car.service.js";
import LinkService from "../Services/link.service.js";
import RoomService from "../Services/room.service.js";
import SystemService from "../Services/system.service.js";
import Request from "../Request/request.js";
import UserService from "../Services/user.service.js";
import CaseService from "../Services/case.service.js";

const API_URL = process.env.API_URL;
const SMS_ENABLE = process.env.SMS_ENABLE;

const createTask = async (req, res) => {
  const { room, mobile } = req.body;
  if (room === undefined || room === "") {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid room",
    });
    return;
  }
  if (mobile === undefined || mobile === "") {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid mobile",
    });
    return;
  }

  await CarService.cancelAllExistingTask({ room });
  const respCreateTask = await CarService.createTask({ room, mobile });

  const uid = respCreateTask;
  if (!uid) {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid room",
    });
    return;
  }
  const service = await RoomService.getServiceId({ room });
  const senderName = await Request.senderName({ service });
  const domain = await UserService.getDomain({ service, type: "video", linkID: uid });
  const messageSMS = "Task \n" + domain + "/app/" + uid;

  console.log("messageSMS", messageSMS);

  if (SMS_ENABLE === "true") {
    Request.sendDDCSMS({ src: senderName, mobile, message: messageSMS }).then((r) => r);
  }

  logger.info("create task room %s mobile %s", room, mobile);

  res.json({
    status: "OK",
    message: "success",
    data: {
      uid,
    },
  });
};

const getTaskList = async (req, res) => {
  const { room, limit = 100 } = req.query;

  if (room === undefined || room === "") {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid room",
    });
    return;
  }
  const resp = await CarService.getTaskList({ room, limit });
  if (resp === false) {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid room",
    });
    return;
  }
  res.json({
    status: "OK",
    data: resp,
  });
};

const getTaskDetail = async ({ uid }) => {
  const destination = {};
  const { status, latitude: carLaititude, longitude: carLongitude, dtmCreated, dtmUpdated, room } = await CarService.getTaskDetail({ uid });
  if (!status) {
    return false;
  }
  const { latitude, longitude, patientLatitude, patientLongitude } = await LinkService.getLinkDetail({ room, userType: "user" });

  switch (true) {
    case status === "start":
      destination.latitude = patientLatitude;
      destination.longitude = patientLongitude;
      break;
    case status === "arrive":
      const serviceId = await RoomService.getServiceId({ room });
      const serviceDetail = await SystemService.getService({ service: serviceId });
      destination.latitude = serviceDetail.latitude;
      destination.longitude = serviceDetail.longitude;
      break;
    case status === "cancel":
      destination.latitude = 0;
      destination.longitude = 0;
      break;
    case status === "complete":
      destination.latitude = 0;
      destination.longitude = 0;
      break;
    case latitude === null || longitude === null:
      destination.latitude = patientLatitude;
      destination.longitude = patientLongitude;
      break;
    case patientLatitude === null || patientLongitude === null:
      destination.latitude = latitude;
      destination.longitude = longitude;
      break;
    default:
      destination.latitude = 0;
      destination.longitude = 0;
  }

  return {
    task: uid,
    status,
    dtmCreated,
    dtmUpdated,
    room,
    current: {
      latitude: carLaititude,
      longitude: carLongitude,
    },
    destination,
  };
};

const getTaskDetailController = async (req, res) => {
  const { id } = req.query;
  if (id === undefined || id === "") {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid task id",
    });
    return;
  }

  const wssURL = API_URL.replace(/^http/, "ws").replace(/^https/, "wss");

  const taskDetail = await getTaskDetail({ uid: id });

  if (!taskDetail.status) {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid task id",
    });
    return;
  }
  if (taskDetail.status === "cancel") {
    res.status(400).json({
      status: "FAIL",
      message: "task is cancel",
    });
    return;
  }
  const room = taskDetail.room;
  const caseDetail = await CaseService.getCaseDetail({ room });

  const serviceData = await SystemService.getService({ service: caseDetail.service });
  const servicePos = {
    service: {
      id: serviceData.serviceId,
      name: serviceData.name,
      latitude: serviceData.latitude,
      longitude: serviceData.longitude,
    },
  };

  taskDetail.webSocket = wssURL + "/mobile?task=" + taskDetail.task;
  res.status(200).json({
    status: "OK",
    message: "success",
    data: Object.assign(caseDetail || {}, taskDetail, servicePos),
  });
};

const sendSocketToQuery = async ({ namespace, id, status, destination, message }) => {
  const sockets = await global.io.of(namespace).fetchSockets();
  sockets.forEach((socket) => {
    if (parseInt(socket.handshake.query.id) === parseInt(id)) {
      if (status !== undefined) {
        socket.emit("status", {
          status,
        });
        socket.emit("message", {
          message: message,
        });
      }
      if (destination !== undefined) {
        socket.emit("destination", {
          ...destination,
        });
        socket.emit("message", {
          message: message,
        });
      }
    }
  });
};

const updateTask = async (req, res) => {
  const { id, status } = req.body;
  if (id === undefined || id === "") {
    res.status(404).json({
      status: "NOT FOUND",
      message: "invalid task id",
    });
    return;
  }

  const validStatuses = ["arrive", "cancel", "complete", "start"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      status: "FAIL",
      message: "invalid status",
    });
    return;
  }

  sendSocketToQuery({
    namespace: "/mobile",
    id,
    status,
    message: "task status update",
  });
  const resp = await CarService.updateTask({ uid: id, status });
  if (resp === 0) {
    res.status(404).json({
      status: "NOT FOUND",
      message: "task not found",
    });
    return;
  }

  if (status === "arrive") {
    // get destination
    const { room } = await CarService.getTaskDetail({ uid: id });
    const serviceId = await RoomService.getServiceId({ room });
    const { latitude, longitude } = await SystemService.getService({ service: serviceId });
    sendSocketToQuery({
      namespace: "/mobile",
      id,
      destination: {
        latitude,
        longitude,
      },
      message: "destination update",
    });
  }

  logger.info("car mobile app task status updated task id %s status %s", id, status);

  res.status(200).json({
    status: "OK",
    message: "success",
    data: {
      task: id,
      status,
    },
  });
};

export default { getTaskList, getTaskDetailController, getTaskDetail, updateTask, sendSocketToQuery, createTask };
