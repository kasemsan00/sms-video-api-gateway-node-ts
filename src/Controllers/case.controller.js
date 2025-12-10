import CaseService from "../Services/case.service.js";
import RoomService from "../Services/room.service.js";
import UsageLogService from "../Services/usageLog.service.js";
import AuthService from "../Services/auth.service.js";
import SocketIOService from "../Socket/socketIO.service.js";
import SystemService from "../Services/system.service.js";
import logger from "../../logger.js";
import dayjs from "dayjs";

const create = async (req, res) => {
  const { userName, room, mobile, linkType, service, organization = "" } = req.body;

  logger.warn("Check Service id %s", service);
  const isService = await SystemService.checkService({ service });
  if (!isService) {
    logger.error("Service id %s %s", service, "invalid");
    res.status(404).json({
      message: "Service not found",
    });
    return;
  }
  logger.info("Service id %s %s", service, "valid");

  const respRoomDetail = await RoomService.getRoomDetail(room);
  logger.info("Room Detail %s", JSON.stringify(respRoomDetail));

  const lastCaseId = await CaseService.getLastCaseId({ service });
  const caseId = lastCaseId + 1;
  const respCase = await CaseService.create({
    caseId,
    service,
    roomId: respRoomDetail.id,
    userName,
    mobileCreated: mobile,
    caseType: linkType,
    organization,
  });
  logger.info("Create case %s", JSON.stringify(respCase));
  UsageLogService.addStatusLog({
    data: `Update Case id:${caseId} userName:${userName} organization:${organization}`,
    userName,
  });
  global.io.of("newqueue").emit("case-data", {
    action: "caseCreated",
  });
  res.json({
    status: "OK",
    data: {
      userName,
      caseId,
    },
  });
};

const getDetail = async (req, res) => {
  const { service, caseId } = req.query;
  if (caseId === undefined || caseId === "") {
    return res.json({
      message: "invalid parameter",
    });
  }

  const respCase = await CaseService.getDetail({ service, caseId });
  if (!respCase) {
    return res.json({
      message: "invalid caseId",
    });
  }
  const roomName = await CaseService.getRoomName({ service, caseId: caseId });
  const respRoomDetail = await RoomService.getRoomDetail(roomName);
  const token = await AuthService.createToken({ name: "crm", days: 365 });

  const namespaces = Array.from(global.io._nsps.keys());

  const respFind = namespaces.find((item) => item === "/" + roomName);

  if (respFind === undefined) {
    logger.info("Initial Socket %s", roomName);
    await SocketIOService.initialSocket({
      io: global.io,
      namespace: roomName,
    });
    const dtmExpired = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss");
    await RoomService.updateExpired({
      room: roomName,
      dtmExpired,
    });
    // update expired
  }

  return res.json({
    caseId: caseId,
    mobileCreated: respCase.mobileCreated,
    operationNumber: respCase.operationNumber,
    caseStatus: respCase.status,
    hn: respCase.hn,
    patientMobile: respCase.patientMobile,
    roomStatus: respRoomDetail.status,
    roomType: respRoomDetail.roomType,
    caseType: respCase.caseType,
    roomName: roomName,
    userName: respCase.userName,
    dtmCreated: respCase.dtmCreated,
    token,
  });
};

const getHistory = async (req, res) => {
  let {
    service,
    searchAllText,
    page,
    limit,
    isAdvancedSearch,
    operationNumber,
    caseId,
    hn,
    isStatusClosed,
    isStatusOnCase,
    isStatusProcess,
    mobileCreated,
    patientMobile,
    dateTimeStart,
    dateTimeEnd,
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page)) {
    page = 1;
  }
  if (isNaN(limit)) {
    limit = 10;
  }
  let type = "";
  if (searchAllText !== "") {
    type = "searchAll";
  }
  if (isAdvancedSearch === "true") {
    type = "searchAdvanced";
  }
  if (dateTimeStart === "undefined") {
    dateTimeStart = "";
  }
  if (dateTimeEnd === "undefined") {
    dateTimeEnd = "";
  }

  const respCaseData = await CaseService.getCaseHistory({
    service,
    text: searchAllText,
    operationNumber,
    caseId,
    hn,
    isStatusClosed,
    isStatusOnCase,
    isStatusProcess,
    mobileCreated,
    patientMobile,
    dateTimeStart,
    dateTimeEnd,
    type,
    output: "list",
    page,
    limit,
  });
  const respCaseCount = await CaseService.getCaseHistory({
    service,
    text: searchAllText,
    operationNumber,
    caseId,
    hn,
    isStatusClosed,
    isStatusOnCase,
    isStatusProcess,
    mobileCreated,
    patientMobile,
    dateTimeStart,
    dateTimeEnd,
    type,
    output: "count",
    page,
    limit,
  });
  if (respCaseData === undefined) {
    return res.json({
      history: [],
      count: 0,
    });
  }
  res.json({
    history: respCaseData,
    count: respCaseCount,
  });
};

const update = async (req, res) => {
  const { service, operationNumber, caseId, status, hn, patientMobile, userName } = req.body;
  logger.info("Update case %s", JSON.stringify(req.body));
  if (caseId === undefined || caseId === "" || service === undefined || service === "") {
    return res.status(404).send("Invalid Parameter");
  }
  UsageLogService.addStatusLog({
    data: `Update Case operationNumber:${operationNumber} id:${caseId} status:${status} hn:${hn} patientMobile${patientMobile} userName:${userName}`,
    userName,
  });

  const respCaseUpdate = await CaseService.update({
    service,
    operationNumber,
    caseId: caseId,
    status,
    hn,
    patientMobile,
    userName,
  });
  if (respCaseUpdate === false) {
    return res.status(404).send("Invalid Parameter");
  }
  global.io.of("newqueue").emit("case-data", {
    action: "caseUpdated",
  });
  return res.json({ caseId, status, hn, patientMobile });
};

export default {
  create,
  getDetail,
  getHistory,
  update,
};
