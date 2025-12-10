import LinkService from "../Services/link.service.js";
import SocketIOService from "../Socket/socketIO.service.js";
import UsageLog from "../Services/usageLog.service.js";
import logger from "../../logger.js";
import Request from "../Request/request.js";
import UserService from "../Services/user.service.js";
import randomString from "randomstring";
import CaseService from "../Services/case.service.js";
import RoomService from "../Services/room.service.js";
import ShareService from "../Services/share.service.js";
import SystemService from "../Services/system.service.js";
import CarService from "../Services/car.service.js";
import CarController from "./car.controller.js";

const SMS_ENABLE = String(process.env.SMS_ENABLE).toLowerCase() === "true";
const CUSTOM_CHARSET = String(process.env.CUSTOM_CHARSET);

const linkWatchPosition = async (req, res) => {
  const userAgent = req.headers["user-agent"].toString();
  const { carRegisNumber, room, mobile, service, linkType = "agentCar" } = req.body;

  if (carRegisNumber === undefined || carRegisNumber === null) {
    return res.status(404).json({ message: "Invalid carRegisNumber" });
  }

  if (service === undefined || service === null) {
    return res.status(404).json({ message: "Invalid service" });
  }

  if (mobile === undefined || mobile === null) {
    return res.status(404).json({ message: "Invalid mobile" });
  }

  if (!room) {
    return res.status(404).json({ message: "Invalid room" });
  }

  const roomDetail = await RoomService.getRoomDetail(room);
  if (!roomDetail) {
    return res.status(404).json({ message: "Invalid room" });
  }

  if (!["userTracking", "agentCar"].includes(linkType)) {
    return res.status(404).json({ message: "Invalid link type" });
  }

  if (linkType === "agentCar") {
    await LinkService.updateLinkType({ room, enabled: 0, linkType });
  }

  const createLink = await LinkService.createLink({
    mobile,
    room,
    isAdmin: 0,
    crmSender: "",
    userName: carRegisNumber,
    userType: "user",
    linkType,
    userAgent,
  });

  const domain = await UserService.getDomain({ service, type: "video", linkID: createLink.linkID });

  if (SMS_ENABLE) {
    let senderName = await Request.senderName({ service });
    let messageSMS = "";
    switch (linkType) {
      case "userTracking":
        messageSMS = 'ติดตามรถเจ้าหน้าที่เลขทะเบียน "' + carRegisNumber + "\n" + domain;
        break;
      case "agentCar":
        messageSMS = "ลิ้งติดตามพิกัด\n" + domain;
        break;
      default:
        break;
    }
    Request.sendDDCSMS({ src: senderName, mobile, message: messageSMS }).then((r) => r);
  }

  res.json({
    status: "OK",
    data: {
      linkID: createLink.linkID,
      room: room,
      domain: domain + "/tracking/" + createLink.linkID,
    },
  });
};

const linkCreate = async (req, res) => {
  let isCreateRoom = false;
  let {
    service = 999,
    mobile,
    room,
    autoRecord,
    recordType,
    encodingOptionsPreset,
    isAdmin,
    crmSender,
    userType,
    linkType,
    requireUserName,
    userName,
    password,
    requireJoinPermission,
    dtmExpired,
    oneTimeLink,
    chatEnabled,
    caseId,
  } = req.body;

  logger.info("linkCreate %s", JSON.stringify(req.body));
  logger.warn("Check Service id %s", service);

  let userAgent = "";
  if (userAgent === "admin") {
    req.headers["user-agent"].toString();
  }

  try {
    const respServiceDetail = await ShareService.getServiceDetail({ service: service, type: linkType });
    const domain = respServiceDetail.domains[0];
    const prefixTextSMS = respServiceDetail.prefixTextSMS;

    const resp = await createSMS({
      service: service,
      mobile,
      room,
      autoRecord,
      recordType,
      encodingOptionsPreset,
      isAdmin,
      crmSender,
      userType,
      linkType,
      requireUserName,
      userName,
      password,
      requireJoinPermission,
      dtmExpired,
      oneTimeLink,
      chatEnabled,
      isCreateRoom,
      userAgent,
      caseId,
      domain,
      prefixTextSMS,
    });
    res.json(resp);
  } catch (error) {
    logger.error("Create link failed %s", error);
    res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};

async function createLinkHLS(req, res) {
  try {
    const { recordId, agentUsername, room, mobile, service } = req.body;
    logger.info("createLinkHLS recordId: %s agentUsername: %s room: %s mobile: %s", recordId, agentUsername, room, mobile);

    const userAgent = req.headers["user-agent"].toString();
    const respCreateLink = await LinkService.createLink({
      recordId: isNaN(recordId) ? 0 : recordId,
      share: 0,
      room,
      isAdmin: 0,
      userName: mobile,
      crmSender: agentUsername,
      userType: "user",
      linkType: "hls",
      userAgent,
    });
    const domain = await UserService.getDomain({ service, type: "hls", linkID: respCreateLink.linkID });

    if (SMS_ENABLE) {
      const senderName = await Request.senderName({ service });
      const messageSMS = 'วิดีโอ HLS "' + "\n" + domain;
      // Request.sendDDCSMS({ src: senderName, mobile, message: messageSMS }).then((r) => r);
    }

    res.json(respCreateLink);
  } catch (error) {
    logger.error("Create link failed %s", error);
    res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
}

async function createSMS({
  sms,
  service = 999,
  mobile,
  room,
  autoRecord,
  recordType,
  encodingOptionsPreset,
  isAdmin,
  crmSender,
  userType,
  linkType,
  requireUserName,
  userName,
  password,
  requireJoinPermission,
  dtmExpired,
  oneTimeLink,
  chatEnabled,
  isCreateRoom,
  userAgent,
  caseId,
  domain,
  prefixTextSMS,
}) {
  if (isNaN(service)) {
    service = 999;
  }
  if (room === undefined) {
    const customCharset = CUSTOM_CHARSET;
    const linkID = randomString.generate({
      length: 6,
      charset: customCharset,
    });
    room = linkID;
  }
  room = room.replace(/[^a-zA-Z ]/g, "");

  if (chatEnabled === undefined) {
    chatEnabled = 1;
  }
  if (autoRecord === undefined) {
    autoRecord = 0;
  }
  if (recordType === undefined) {
    recordType = "RoomCompositeVideoAudio";
  }
  if (encodingOptionsPreset === undefined) {
    encodingOptionsPreset = "H264_720P_30";
  }
  if (oneTimeLink === undefined) {
    oneTimeLink = 0;
  }
  if (linkType === undefined) {
    linkType = "video";
  }
  if (mobile === undefined) {
    mobile = "";
  }
  if (userName === undefined) {
    userName = mobile;
  }
  if (crmSender === undefined) {
    crmSender = "";
  }
  if (sms === undefined) {
    sms = 1;
  }
  sms = parseInt(sms);
  if (room === undefined) {
    logger.error("CreateLink invalid parameter");
    return {
      status: "FAIL",
      message: "invalid parameter",
    };
  }
  let roomDetail = await RoomService.getRoomDetail(room);
  logger.info("room detail %s", JSON.stringify(roomDetail));
  if (roomDetail === false) {
    await LinkService.createLink({
      share: 1,
      room,
      isAdmin: 0,
      userName: "Guest",
      userType: "user",
      linkType: "video",
      userAgent,
    });
    await LinkService.createLink({
      share: 1,
      room,
      isAdmin: 0,
      userName: "Viewer",
      userType: "viewer",
      linkType: "video",
      userAgent,
    });
    const respCreateRoom = await RoomService.createRoom({
      service,
      room,
      linkType,
      autoRecord,
      recordType,
      encodingOptionsPreset,
      chatEnabled,
      userAgent,
    });

    await CaseService.update({ roomId: respCreateRoom.insertId, caseId, service });
    await SocketIOService.initialSocket({
      io: global.io,
      namespace: room,
    });
  } else {
    logger.warn(
      "namespace exist %s",
      JSON.stringify({
        room,
        roomType: roomDetail.roomType,
        autoRecord,
        chatEnabled,
        userAgent,
      }),
    );

    let roomType = roomDetail.roomType;
    if ((roomDetail.roomType === "location" && linkType === "conference") || (roomDetail.roomType === "location" && linkType === "video")) {
      roomType = "conference";
      await RoomService.updateRoomStatus({
        room,
        status: "open",
      });
    }
    await RoomService.updateRoomType({
      room,
      roomType,
      autoRecord,
      chatEnabled,
      userAgent,
    });
    if (roomDetail.roomType !== roomType) {
      // room update
      global.io.of(room).emit("case-data", {
        action: "roomUpdate",
        roomType: roomType,
      });
    }
  }
  const createLink = await LinkService.createLink({
    mobile,
    room,
    isAdmin,
    crmSender,
    userName,
    userType,
    linkType,
    requireJoinPermission,
    requireUserName,
    autoRecord,
    oneTimeLink,
    password,
    dtmExpired,
    userAgent,
  });
  logger.info("CreateLink %s", createLink.linkID);
  switch (linkType) {
    case "video":
      createLink.url = domain + "/video/" + createLink.linkID;
      break;
    case "conference":
      createLink.url = domain + "/video/" + createLink.linkID;
      break;
    case "location":
      createLink.url = domain + "/location/" + createLink.linkID;
      break;
    default:
      domain = process.env.MY_WEBUI_VIDEO_DOMAIN[0];
      createLink.url = domain + "/" + linkType + "/" + createLink.linkID;
      break;
  }
  createLink.linkType = linkType;
  await UsageLog.addStatusLog({
    linkID: createLink.linkID,
    userType: userType,
    mobile,
    linkType,
    room,
    identity: "",
    status: "CreateLink",
    userAgent,
    data: createLink,
  });
  roomDetail = await RoomService.getRoomDetail(room);

  const objResult = Object.assign({}, createLink, roomDetail);
  if (mobile !== "") {
    if (SMS_ENABLE) {
      if (sms === 1) {
        let senderName = await Request.senderName({ service });
        logger.info("Send SMS %s %s", senderName, mobile);
        try {
          let messageSMS = "";
          if (linkType === "video") {
            messageSMS = prefixTextSMS + "\n" + createLink.url;
          }
          if (linkType === "location") {
            messageSMS = prefixTextSMS + "\n" + createLink.url;
          }
          Request.sendDDCSMS({ src: senderName, mobile, message: messageSMS }).then((r) => r);
        } catch (e) {
          console.error(e);
        }
      } else {
        logger.warn("Params Send SMS is Disable");
      }
    } else {
      logger.warn("Global variable Send SMS is Disable");
    }
  }
  return objResult;
}
const getShareURL = async (req, res) => {
  try {
    const { room } = req.query;
    logger.info("GetShareURL %s", JSON.stringify(req.query));

    const serviceId = await RoomService.getServiceId({ room });
    if (serviceId === null) {
      return res.status(404).send("invalid");
    }

    let respGuest, respViewer, respServiceDetail, domain;

    try {
      respGuest = await LinkService.getShareURL({ room, type: "Guest" });
    } catch (error) {
      logger.error("Error getting Guest URL: %s", error.message);
      respGuest = null;
    }

    try {
      respViewer = await LinkService.getShareURL({ room, type: "Viewer" });
    } catch (error) {
      logger.error("Error getting Viewer URL: %s", error.message);
      respViewer = null;
    }

    try {
      respServiceDetail = await ShareService.getServiceDetail({ service: serviceId, type: "video" });
      domain = respServiceDetail.domains[0];
    } catch (error) {
      logger.error("Error getting service detail: %s", error.message);
      domain = null;
    }

    const response = {
      url: respGuest && domain ? domain + "/video/" + respGuest.linkID : "-",
      guest: respGuest && domain ? domain + "/video/" + respGuest.linkID : "-",
      viewer: respViewer && domain ? domain + "/viewer/" + respViewer.linkID : "-",
    };

    res.json(response);
  } catch (error) {
    logger.error("Error in getShareURL: %s", error.message);
    res.json({
      url: "-",
      guest: "-",
      viewer: "-",
    });
  }
};
const getLinkDetail = async (req, res) => {
  let { linkId, identity } = req.query;
  const userAgent = req.headers["user-agent"].toString();

  logger.info("GetLinkDetail %s", req.query.linkId);

  identity = identity ? identity.trim() : undefined;
  let roomJoin = true;
  let userDetail = {};
  let generateUser = {};

  const linkDetail = await LinkService.getLinkDetail({ linkID: linkId });
  logger.info("GetLinkDetail %s", JSON.stringify(linkDetail));
  if (linkDetail === null) {
    res.json({
      status: "FAIL",
      message: "invalid linkID",
    });
    logger.error("Invalid linkID %s", linkId);
    return null;
  }
  if (linkDetail.oneTimeLink === 2) {
    res.json({
      status: "FAIL",
      message: "linkID expired",
    });
  }

  let roomDetail = await RoomService.getRoomDetail(linkDetail.room);

  if (!roomDetail) {
    logger.error("Invalid room %s", linkDetail.room);
    res.json({
      status: "FAIL",
      message: "invalid room",
    });
    return null;
  }
  if (identity !== undefined) {
    userDetail = await UserService.getUserDetail({ room: linkDetail.room, identity: identity, socketId: "" });
    console.log("User detail", JSON.stringify(userDetail));
  }

  const dtmCurrent = new Date();
  const expired = new Date(linkDetail.dtmExpired);
  if (linkDetail.dtmExpired !== null && dtmCurrent > expired) {
    logger.warn(`Link ${linkId} expired`);
    linkDetail.status = "linkExpired";
    res.json({
      status: "FAIL",
      message: "linkID expired",
      data: linkDetail,
    });
    return null;
  }

  linkDetail.requireJoinPermission === 1 ? (roomJoin = false) : null;

  let userType = linkDetail.isAdmin.toString() !== "1" ? "user" : "admin";

  if (linkDetail.requirePassword === 0) {
    let userName;
    if (linkDetail.userName !== null) {
      userName = linkDetail.userName;
    } else if (userDetail.userName !== undefined) {
      userName = userDetail.userName;
    } else {
      logger.info("Generate new username");
      userName = UserService.generateUserName();
    }
    logger.info("LinkDetail Username : %s", userName);
    generateUser = await UserService.generateUser({
      linkID: linkId,
      linkType: linkDetail.linkType,
      mobile: linkDetail.mobile,
      room: linkDetail.room,
      identity: identity,
      userName: userName,
      color: userDetail.color ? userDetail.color : undefined,
      userType: linkDetail.userType,
      isAddUser: false,
      roomJoin: roomJoin,
      conference: 1,
      userAgent: userAgent,
    });
    logger.info(
      "Generate user %s %s %s %s %s",
      generateUser.linkID,
      generateUser.identity,
      generateUser.userName,
      generateUser.userType,
      generateUser.service,
    );
  }
  const respListParticipants = await UserService.listParticipants(linkDetail.room);

  if (!respListParticipants) {
    roomDetail.listParticipants = [];
  } else {
    roomDetail.listParticipants = respListParticipants;
  }

  let latLngGroup = await LinkService.getLatLngGroup({
    room: linkDetail.room,
    userType: "user",
  });
  res.json({
    status: "OK",
    data: Object.assign({}, { id: linkId }, linkDetail, roomDetail, generateUser, {
      positionUser: latLngGroup,
    }),
  });
  // set link expired
  if (userType === "admin" && roomDetail.messageUnread === 1) {
    RoomService.updateMessageUnread({
      room: linkDetail.room,
      messageUnread: 0,
    });
    io.of("newqueue").emit("case-data", {
      action: "messageUnread",
      room: linkDetail.room,
      messageUnread: 1,
    });
  }
  LinkService.updateUserAgent({ linkID: linkId, userAgent });
  UsageLog.addStatusLog({
    linkID: linkId,
    linkType: linkDetail.linkType,
    room: linkDetail.room,
    identity: generateUser.identity,
    userType: userType,
    status: "GetLinkDetail",
    userAgent,
    data: linkDetail,
  });
};

const updateLatLngLinkDetail = async (req, res) => {
  const { linkID, room, userType, latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = req.body;
  const resp = await LinkService.updateLatLngLinkDetail({
    linkID,
    latitude,
    longitude,
    accuracy,
  });
  await UsageLog.addStatusLog({
    linkID: linkID,
    room: room,
    userType,
    status: "UpdateLatLngLinkDetail",
    latitude,
    longitude,
  });

  setTimeout(async () => {
    UsageLog.getCRMLinkStatusLog({
      linkID: linkID,
      room: room,
      linkType: "location",
    })
      .then((result) => {
        global.io.of("data/" + linkID).emit("history", result);
      })
      .catch((err) => {
        console.log(err);
      });
  }, 1000);

  const emitData = {
    linkID,
    service: 2,
    latitude,
    longitude,
    accuracy,
    altitude,
    altitudeAccuracy,
    heading,
    speed,
    currentLocation: {
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
    },
    pickLocation: null,
    timestamp: new Date().getTime(),
  };

  console.log("Emit to data/" + linkID, JSON.stringify(emitData));
  global.io.of("data/" + linkID).emit("position", emitData);
  global.io.of(room).emit("case-data", {
    action: "updateLatLng",
    message: "from sv",
  });

  const carList = await CarService.getCarTrackList({ room });
  if (carList) {
    carList.forEach(async (car) => {
      const id = car.id;
      CarController.sendSocketToQuery({
        namespace: "/mobile",
        id,
        destination: {
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
        },
        message: "destination update",
      });
    });
  }

  if (resp) {
    res.json({
      status: "OK",
    });
  } else {
    res.json({
      status: "FAIL",
    });
  }
};

const history = async (req, res) => {
  const { roomName, page } = req.query;
  if (roomName === undefined || roomName === null) {
    return res.status(404).send("Invalid parameter");
  }
  const resp = await LinkService.getSMSLinkHistory({ roomName, page, order: "ASC" });
  const respCount = await LinkService.getSMSLinkHistory({ output: "count", page, roomName, order: "ASC" });
  if (resp) {
    res.json({
      data: resp,
      count: respCount,
    });
  } else {
    res.status(404).send("Invalid parameter");
  }
};

const sendCustomMessage = async (req, res) => {
  const { message, mobile, room } = req.body;
  if (message === undefined) {
    return res.status(404).send("Invalid url");
  }
  if (mobile === undefined) {
    return res.status(404).send("Invalid mobile");
  }

  const service = await RoomService.getServiceId({ room });
  if (!service) {
    return res.status(404).send("Invalid room");
  }

  if (message.trim() === "") {
    return res.send(404).message("message is empty");
  }
  const senderName = await Request.senderName({ service });

  try {
    Request.sendDDCSMS({ src: senderName, mobile, message }).then((r) => r);
  } catch (e) {
    console.error(e);
  }
  UsageLog.addStatusLog({
    room,
    mobile,
    status: "smsSurvey",
    data: message,
  });
  res.json({
    message: "Send sms complete",
  });
};
const getDomain = async (req, res) => {
  const { linkID, type, sender } = req.query;
  const domain = await UserService.getDomain({ sender, type, linkID });
  logger.info("Get domain %s", JSON.stringify(domain));
  res.send(domain);
};

const multiLatlng = async (req, res) => {
  try {
    const { linkID, room, userType, currentLocation, pickLocation } = req.body;

    const emitData = {
      linkID,
      service: 2,
      userType,
      room,
      latitude: currentLocation?.latitude || 0,
      longitude: currentLocation?.longitude || 0,
      accuracy: currentLocation?.accuracy || 0,
      altitude: currentLocation?.altitude || 0,
      altitudeAccuracy: currentLocation?.altitudeAccuracy || 0,
      heading: currentLocation?.heading || 0,
      speed: currentLocation?.speed || 0,
      currentLocation,
      pickLocation,
      timestamp: Date.now(),
    };

    const carList = await CarService.getCarTrackList({ room });
    if (carList) {
      carList.forEach(async (car) => {
        const id = car.id;
        CarController.sendSocketToQuery({
          namespace: "/mobile",
          id,
          destination: {
            latitude: currentLocation?.latitude || 0,
            longitude: currentLocation?.longitude || 0,
            accuracy: currentLocation?.accuracy || 0,
            altitude: currentLocation?.altitude || 0,
            altitudeAccuracy: currentLocation?.altitudeAccuracy || 0,
            heading: currentLocation?.heading || 0,
            speed: currentLocation?.speed || 0,
          },
          message: "destination update",
        });
      });
    }

    console.log("linkID", linkID, "paitentLocation", pickLocation?.latitude, pickLocation?.longitude);
    await LinkService.updatePatientLocation({ linkID, patientLatitude: pickLocation?.latitude, patientLongitude: pickLocation?.longitude });
    global.io.of(`data/${linkID}`).emit("position", emitData);
    await UsageLog.addStatusLog({
      linkID,
      room,
      userType,
      status: "MultiLatLng",
      latitude: currentLocation?.latitude || 0,
      longitude: currentLocation?.longitude || 0,
      data: emitData,
    });
    res.json(emitData);
  } catch (error) {
    logger.error(`Failed to update location`);
    console.log(req.body);
    console.log(error);

    res.status(500).json({ error: "Failed to update location" });
  }
};

export default {
  multiLatlng,
  createSMS,
  getDomain,
  sendCustomMessage,
  getShareURL,
  linkCreate,
  getLinkDetail,
  history,
  updateLatLngLinkDetail,
  linkWatchPosition,
  createLinkHLS,
};
