import SocketIO from "../Socket/socketIO.service.js";
import logger from "../../logger.js";
import randomString from "randomstring";
import AuthService from "../Services/auth.service.js";
import LinkController from "../Controllers/link.controller.js";
import RoomService from "../Services/room.service.js";
import ShareService from "../Services/share.service.js";
import caseService from "../Services/case.service.js";
import dayjs from "dayjs";

const IPPBX_API_URL = process.env.IPPBX_API_URL;
const WSS_DOMAIN = normalizeWssDomain(process.env.API_URL);
const CUSTOM_CHARSET = String(process.env.CUSTOM_CHARSET);

function normalizeWssDomain(wssDomain) {
  if (typeof wssDomain !== "string") {
    return "ws://localhost:5500";
  }
  const hasProtocol = wssDomain.startsWith("http") || wssDomain.startsWith("https");
  const protocol = hasProtocol ? wssDomain.split("://")[0] : "http";
  const domain = hasProtocol ? wssDomain.split("://")[1] : wssDomain;
  return `${protocol === "http" ? "ws" : "wss"}://${domain}`;
}

const linkCISCreate = async ({ url, ippbxId, phoneNumber, sms, agent, branch }) => {
  if (parseInt(sms) === 0) {
    sms = "false";
  }

  const resp = await createLinkWebRTCSip({
    url,
    ippbxId,
    phoneNumber,
    sms,
    agent,
    type: "webrtc",
    branchId: branch,
  });
  if (resp instanceof Error) {
    return {
      status: "FAIL",
      message: "Unable create link sms",
    };
  }
  if (resp.status === "FAIL") {
    return {
      status: "FAIL",
      message: "Unable create link sms",
    };
  }

  const token = await AuthService.createToken({ name: resp.id, days: 1 });
  if (resp.id !== undefined) {
    await SocketIO.initialSocket({
      io: global.io,
      namespace: "data/" + resp.id,
    });
    logger.info("Init socket data data/%s", resp.id);
  } else {
    logger.error("Unable Init socket data/%s", resp.id);
  }
  return {
    status: "OK",
    data: {
      cis: true,
      id: resp.id,
      userUrl: resp.url,
      dataWebsocketURL: WSS_DOMAIN + "/data/" + resp.id + "?token=" + token,
      accessToken: token,
    },
  };
};

export const linkIDEMSCreate = async (req, res) => {
  let { ippbxId, mobile, agent, autoRecord, recordType, encodingOptionsPreset, agentName, linkType, sms, branch } = req.body;
  let isCIS = false;
  if (branch === undefined) {
    res.json({
      status: "FAIL",
      message: "Invalid branch",
    });
    return;
  }

  if (linkType !== "video" && linkType !== "location") {
    res.json({
      status: "FAIL",
      message: "Invalid linkType",
    });
    return;
  }

  const respIppbxBranchCheck = await ippbxBranchCheck({ branch });
  // console.log("resp ippbx branch check", JSON.stringify(respIppbxBranchCheck));
  isCIS = !(!respIppbxBranchCheck || respIppbxBranchCheck.status === "FAIL");

  // console.log("Check isCIS", isCIS);
  if (isCIS && linkType === "video") {
    const sipCreateLinkURL = respIppbxBranchCheck.data.data + "createlink";
    console.log("Create link url", sipCreateLinkURL);
    const resp = await linkCISCreate({ url: sipCreateLinkURL, ippbxId, phoneNumber: mobile, sms, branch, agent });
    res.json(resp);
    return;
  }
  const customCharset = CUSTOM_CHARSET;
  const uid = randomString.generate({
    length: 6,
    charset: customCharset,
  });

  const requireJoinPermission = 0;
  const chatEnabled = 1;
  const password = "";
  const userName = mobile;
  const service = 1;
  const requireUserName = 0;
  let isCreateRoom = false;
  const userAgent = req.headers["user-agent"].toString();

  const dtmExpired = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

  const respServiceDetail = await ShareService.getServiceDetail({ service, type: linkType });
  const domain = respServiceDetail.domains[0];
  const prefixTextSMS = respServiceDetail.prefixTextSMS;

  const respUser = await LinkController.createSMS({
    sms,
    service,
    mobile,
    room: uid,
    autoRecord,
    recordType,
    encodingOptionsPreset,
    isAdmin: 0,
    crmSender: agentName,
    userType: "user",
    linkType,
    requireUserName,
    userName,
    password,
    requireJoinPermission,
    dtmExpired: dtmExpired,
    oneTimeLink: undefined,
    chatEnabled,
    isCreateRoom,
    userAgent,
    prefixTextSMS,
    domain,
  });

  const respAdmin = await LinkController.createSMS({
    sms,
    service,
    mobile: "",
    room: uid,
    autoRecord,
    recordType,
    encodingOptionsPreset,
    isAdmin: 1,
    crmSender: agentName,
    userType: "admin",
    linkType,
    requireUserName,
    userName: agentName,
    password,
    requireJoinPermission,
    dtmExpired: dtmExpired,
    oneTimeLink: undefined,
    chatEnabled,
    isCreateRoom,
    userAgent,
    prefixTextSMS,
    domain,
  });

  const roomId = respAdmin.id;
  const respLastCaseId = await caseService.getLastCaseId({ service });
  const caseId = respLastCaseId + 1;

  const respCase = await caseService.create({
    caseId: caseId,
    service,
    roomId: roomId,
    userName,
    mobileCreated: mobile,
    caseType: linkType,
    organization: branch,
  });

  logger.info("Create case %s %s", caseId, JSON.stringify(respCase));

  const token = await AuthService.createToken({ name: uid, days: 1 });
  await SocketIO.initialSocket({
    io: global.io,
    namespace: "data/" + respUser.linkID,
  });
  logger.info("Init socket data data/%s", respUser.linkID);

  let userURL = domain + "/" + linkType + "/" + respUser.linkID;
  let agentURL = domain + "/" + linkType + "/" + respAdmin.linkID;
  if (linkType === "location") {
    agentURL = undefined;
  }

  // console.log("User LinkID", respUser.linkID, "dtmExpired", dtmExpired);

  return res.json({
    status: "OK",
    data: {
      caseId: caseId,
      cis: false,
      roomId: roomId,
      linkUserId: respUser.linkID,
      linkAdminId: respAdmin.linkID,
      linkType: linkType,
      recordType: recordType,
      room: uid,
      mobile,
      userURL,
      agentURL,
      dataWebsocketURL: WSS_DOMAIN + "/data/" + respUser.linkID + "?token=" + token,
      accessToken: token,
    },
  });
};

// REQUEST modules

async function createLinkWebRTCSip({ phoneNumber, smsEnabled = false, agentId = "9999", branchId, conference = 0, ippbxId = "", type = "webrtc" }) {
  if (!phoneNumber || !branchId) return;

  const request = {
    phonenumber: phoneNumber,
    sms: smsEnabled,
    agent: agentId,
    branch_id: branchId,
    conference,
    ippbx_id: ippbxId,
    type,
  };

  try {
    const response = await fetch("https://cis-api-rtc-idems.fm-sp.com/createlink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status === 404) {
      logger.error("Fetch failed 404");
      return new Error("Fetch failed 404");
    }

    return await response.json();
  } catch (error) {
    logger.error("Create link error", error);
    return error;
  }
}

export async function ippbxBranchCheck({ branch }) {
  if (!IPPBX_API_URL) return false;

  try {
    const response = await fetch(`${IPPBX_API_URL}/${branch}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return await response.json();
  } catch (error) {
    return false;
  }
}

export default {
  linkIDEMSCreate,
  ippbxBranchCheck,
};
