import sql from "./db.service.js";
import dayjs from "dayjs";
import crypto from "crypto";
import randomString from "randomstring";
import logger from "../../logger.js";
import UsageLogService from "./usageLog.service.js";
import { UAParser } from "ua-parser-js";

const CUSTOM_CHARSET = String(process.env.CUSTOM_CHARSET);
const ROOM_DAY_DEFAULT_TIMEOUT = Number(process.env.ROOM_DAY_DEFAULT_TIMEOUT);

const getShareURL = async ({ room = undefined, type = "Guest" }) => {
  if (room === undefined) {
    return false;
  }
  const stmt = `SELECT linkID FROM link_connect WHERE room = '${room}' and share = 1 AND userName = '${type}'`;

  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return false;
  }
  return resp[0];
};
const createLink = async ({
  share = 0,
  mobile = "",
  room,
  recordId = 0,
  isAdmin = 0,
  userType,
  linkType,
  crmSender = "",
  userName,
  requireJoinPermission = 0,
  requireUserName = 0,
  password = "",
  oneTimeLink = 0,
  dtmExpired,
  userAgent,
}) => {
  // Set requirePassword based on password value
  const requirePassword = password === "" ? 0 : 1;

  // Set expiration date if not provided
  if (!dtmExpired) {
    dtmExpired = dayjs().add(ROOM_DAY_DEFAULT_TIMEOUT, "day").format("YYYY-MM-DD HH:mm:ss");
  }

  // Generate link ID
  const linkID = randomString.generate({
    length: 6,
    charset: CUSTOM_CHARSET,
  });

  // Format dates and parse values
  const dtmCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const parsedRequireUserName = parseInt(requireUserName);
  const password_hash = crypto.createHash("md5").update(password).digest("hex");

  // Prepare SQL statement and parameters
  const stmt = `
    INSERT INTO link_connect(
      share, mobile, linkID, room, recordId, crmSender, userType, linkType, userName, 
      isAdmin, requireJoinPermission, requireUserName, requirePassword, 
      oneTimeLink, password, dtmCreated, dtmExpired, userAgent
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = [
    share,
    mobile,
    linkID,
    room,
    recordId,
    crmSender,
    userType,
    linkType,
    userName,
    isAdmin,
    requireJoinPermission,
    parsedRequireUserName,
    requirePassword,
    oneTimeLink,
    password_hash,
    dtmCreated,
    dtmExpired,
    userAgent,
  ];

  // Execute query and handle result
  const result = await sql.query(stmt, params);

  if (!result) {
    return false;
  }

  if (result.affectedRows === 1) {
    return {
      linkID,
      isAdmin,
      requireJoinPermission,
      userName,
      password,
      dtmExpired,
    };
  }

  return false;
};

const getLinkDetail = async ({ linkID, room, userType = undefined }) => {
  if (linkID !== undefined) {
    let stmt = `SELECT linkID, room, enabled, mobile, isAdmin, userName, userType, linkType, mobile, 
                requireJoinPermission, crmSender, requireUserName, requirePassword, oneTimeLink, dtmCreated, dtmExpired
                FROM link_connect WHERE linkID = '${linkID}' `;

    const result = await sql.query(stmt);
    if (result === undefined) {
      return null;
    }
    if (result.length === 0) {
      return null;
    }
    if (result.length === 1) {
      return result[0];
    }
  }
  if (room !== undefined) {
    let condition = `room = '${room}'`;
    if (userType !== undefined) {
      condition += ` AND userType = '${userType}'`;
    }
    let stmt = `SELECT linkID, room, isAdmin, enabled, userName, userType, linkType, mobile, requireJoinPermission, 
                crmSender, requireUserName, requirePassword, oneTimeLink, dtmCreated, dtmExpired,
                latitude, longitude, patientLatitude, patientLongitude
                FROM link_connect WHERE ${condition} ORDER BY id DESC LIMIT 1 `;

    const result = await sql.query(stmt);
    if (result === undefined) {
      return null;
    }
    if (result.length === 0) {
      return null;
    }
    if (result.length === 1) {
      return result[0];
    }
  }
  return null;
};
const getOneTimeLinkStatus = async ({ linkID }) => {
  if (linkID !== undefined) {
    let stmt = `SELECT oneTimeLink FROM link_connect WHERE linkID = '${linkID}' `;
    // console.log(stmt);
    const result = await sql.query(stmt);
    if (result !== undefined && result.length === 1) {
      return result[0].oneTimeLink;
    }
    return null;
  }
  return null;
};
const updateOneTimeLink = async ({ linkID, status }) => {
  if (linkID !== undefined && status !== undefined) {
    let stmt = `UPDATE link_connect SET oneTimeLink = ${status} WHERE linkID = '${linkID}' `;
    const result = await sql.query(stmt);
    return result !== undefined && result.affectedRows === 1;
  }
  logger.error("updateOneTimeLink invalid parameter");
  return null;
};
const updateLatLngLinkDetail = async ({ linkID, latitude, longitude, accuracy = 0 }) => {
  if (linkID === undefined) {
    return;
  }
  let stmt = `UPDATE link_connect SET latitude = '${latitude}', longitude = '${longitude}', accuracy = '${accuracy}' WHERE linkID = '${linkID}'  `;
  const result = await sql.query(stmt);
  return result !== undefined && result.affectedRows === 1;
};
const updatePatientLocation = async ({ linkID, patientLatitude, patientLongitude }) => {
  if (linkID === undefined) {
    return null;
  }
  const patientUpdated = dayjs().format("YYYY-MM-DD HH:mm:ss");
  let stmt = `UPDATE link_connect SET patientLatitude = '${patientLatitude}', patientLongitude = '${patientLongitude}', patientUpdated = '${patientUpdated}' WHERE linkID = '${linkID}'`;
  const result = await sql.query(stmt);
  return result !== undefined && result.affectedRows === 1;
};

const getLastLatLng = async ({ room, userType, share = 0 }) => {
  if (room === undefined) {
    return null;
  }
  if (userType === undefined) {
    userType = "";
  }
  let stmt = `SELECT latitude, longitude FROM link_connect WHERE room = '${room}' AND userType = '${userType}' AND share = '${share}' LIMIT 1`;
  const result = await sql.query(stmt);

  if (result === undefined) {
    return undefined;
  }
  if (result.length === 0) {
    return undefined;
  }
  if (result[0].latitude === null && result[0].longitude === null) {
    return undefined;
  }
  return result[0];
};
const getUserMobile = async ({ room }) => {
  if (room === undefined) {
    return;
  }
  let stmt = `SELECT mobile FROM link_connect WHERE room = '${room}' AND userType = 'user' LIMIT 1 `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return "";
  }
  if (resp.length !== 0) {
    return resp[0].mobile;
  }
  return "";
};
const updateLinkIDLatLng = async ({ linkID, accuracy, latitude, longitude }) => {
  if (linkID === undefined) {
    return;
  }
  let stmt = `UPDATE link_connect SET accuracy = '${accuracy}' ,latitude = '${latitude}', longitude = '${longitude}' WHERE linkID = '${linkID}'`;
  return sql.query(stmt);
};
const updateUserAgent = ({ linkID, userAgent }) => {
  if (linkID === undefined) {
    return;
  }
  const device = new UAParser(userAgent || "");
  const os = device.getOS().name;
  let stmt = `UPDATE link_connect SET userAgent = '${userAgent}', os = '${os}' WHERE linkID = '${linkID}'`;
  return sql.query(stmt);
};
const getLatLngGroup = async ({ room, userType }) => {
  if (room === undefined) {
    return null;
  }
  let stmt = `SELECT id, link_connect.mobile, share, userName, accuracy, latitude, longitude, errorLocation  FROM link_connect
                WHERE link_connect.room = '${room}' AND userType = '${userType}' ORDER BY id DESC`;

  const result = await sql.query(stmt);
  if (result.length === 0) {
    return [];
  }
  if (result.length !== 0) {
    let newData = [];
    result.forEach((item) => {
      const find = newData.find((data) => data.userName === item.userName);
      if (find === undefined) {
        if (item.latitude === null) {
          item.latitude = 0;
        }
        if (item.longitude === null) {
          item.longitude = 0;
        }
        if (item.share === 0) {
          newData.push(item);
        }
        if (item.share === 1 && item.latitude !== 0 && item.longitude !== 0) {
          newData.push(item);
        }
      }
    });
    return newData;
  }
};

const getSMSLinkHistory = async ({
  service = undefined,
  output = "list",
  text = undefined,
  type = "",
  page = 1,
  limit = 5,
  roomId = undefined,
  roomName = undefined,
  mobile = undefined,
  agentName = undefined,
  linkType = undefined,
  status = undefined,
  dateTimeStart = undefined,
  dateTimeEnd = undefined,
  order = "DESC",
}) => {
  let OFFSET = 0;
  let conditionService = "";
  let conditionLimitOffset = "";
  let conditionRoomId = "";
  let conditionRoomName = "";
  let conditionSearchAll = "";
  let conditionDateTimeRange = "";
  if (page === 1) {
    OFFSET = 0;
  }
  if (page > 1) {
    OFFSET = limit * page - limit;
  }
  if (service !== undefined) {
    conditionService = `link_connect.service = ${service} AND `;
  }
  if (roomId !== undefined) {
    conditionRoomId = `AND room_conference.id = '${roomId}' `;
  }
  if (roomName !== undefined) {
    conditionRoomName = `AND room_conference.room = '${roomName}'`;
  }
  if (dateTimeStart !== undefined && dateTimeEnd !== undefined) {
    conditionDateTimeRange = `AND room_conference.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
  }
  if (output === "list") {
    conditionLimitOffset = `LIMIT ${limit} OFFSET ${OFFSET}`;
  }

  let stmt = `SELECT DISTINCT 
                case_data.id as caseId,
                link_connect.linkID,
                case_data.status as caseStatus,
                case_data.hn,
                case_data.patientMobile, 
                room_conference.room, room_conference.id, link_connect.mobile, 
                link_connect.linkType, link_connect.crmSender, 
                link_connect.latitude, link_connect.longitude,
                link_connect.patientLatitude, link_connect.patientLongitude,
                link_connect.patientUpdated,
                link_connect.dtmCreated
              FROM room_conference 
              LEFT JOIN link_connect ON link_connect.room = room_conference.room 
              LEFT JOIN case_data ON case_data.roomId = room_conference.id
              WHERE 
              ${conditionService} link_connect.mobile != '' ${conditionRoomId} ${conditionRoomName} 
              ${conditionSearchAll}
              ${conditionDateTimeRange}
              AND share = 0
              ORDER BY link_connect.dtmCreated ${order} 
              ${conditionLimitOffset} 
            `;

  const resp = await sql.query(stmt);
  if (resp.length !== 0) {
    for (let data of resp) {
      data.agent = await UsageLogService.getAgent({ room: data.room });
      data.status = await UsageLogService.getRoomStatus({ room: data.room });
      data.activeLog = await UsageLogService.getCRMLinkStatusLog({ linkID: data.linkID });
      // data.recordVideos = await RecordService.getFileHistory({ room: data.room });
      data.recordVideos = [];
      if (data.latitude === null) {
        data.latitude = undefined;
      }
      if (data.longitude === null) {
        data.longitude = undefined;
      }
    }
  }
  if (type === "searchAll" && text.trim() !== "") {
    console.log("type", type, "text", text);
    const nData = [];
    for (const respElement of resp) {
      const linkTypeThai = convertLinkTypeThai(respElement.linkType);
      const statusThai = convertStatusThai(respElement.status);

      if (statusThai.includes(text)) {
        nData.push(respElement);
      }
      if (linkTypeThai.includes(text)) {
        nData.push(respElement);
      }
      if ((respElement.dtmCreated + "").includes(text)) {
        nData.push(respElement);
      }
      if (respElement.mobile.includes(text)) {
        nData.push(respElement);
      }
      if (respElement.agent !== false && respElement.agent.includes(text)) {
        nData.push(respElement);
      }
    }
    if (output === "count") {
      return nData.length;
    } else {
      return nData;
    }
  }
  if (type === "searchAdvanced") {
    const nData = [];
    if (status === "all") {
      status = "";
    }
    resp.forEach((respElement) => {
      const linkTypeThai = convertLinkTypeThai(respElement.linkType);
      let valid = {
        status: false,
        linkType: false,
        mobile: false,
        agentName: false,
      };

      if (status !== "disable" && respElement.status.includes(status)) {
        valid.status = true;
      }
      if (linkTypeThai.includes(linkType)) {
        valid.linkType = true;
      }
      if ((respElement.agent + "").includes(agentName)) {
        valid.agentName = true;
      }
      if (respElement.mobile.includes(mobile)) {
        valid.mobile = true;
      }
      if (valid.status && valid.linkType && valid.mobile && valid.agentName) {
        nData.push(respElement);
      }
    });
    if (output === "count") {
      return nData.length;
    } else {
      return nData;
    }
  }
  if (output === "count") {
    return resp.length;
  } else {
    return resp;
  }
};
const getListLinkId = async ({ service, status = undefined, userType, room = undefined }) => {
  let conditionRoom = "";
  let conditionStatus = "";
  if (room !== undefined) {
    conditionRoom = ` AND room_conference.room = '${room}' `;
  }
  if (status !== undefined) {
    conditionStatus = ` AND status = '${status}' `;
  }

  const stmt = `SELECT linkID, room_conference.room, room_conference.status FROM link_connect 
                LEFT JOIN room_conference ON room_conference.room = link_connect.room 
                WHERE service = ${service} ${conditionStatus} AND userType = '${userType}' ${conditionRoom} `;
  const result = await sql.query(stmt);
  if (result.length === 0) {
    return false;
  }
  if (result.length !== 0) {
    return result;
  }
};

function convertStatusThai(status) {
  if (status === "open") {
    return "กำลังสนทนา";
  }
  if (status === "close") {
    return "สิ้นสุดการสนทนา";
  }
}
function convertLinkTypeThai(linkType) {
  if (linkType === "video") {
    return "วิดีโอ";
  }
  if (linkType === "location") {
    return "พิกัด";
  }
}

const checkAndUpdateOneTimeLink = async ({ linkID }) => {
  const oneTimeDetail = await getOneTimeLinkStatus({ linkID: linkID });
  if (oneTimeDetail === null) {
    return null;
  }
  const status = oneTimeDetail.oneTimeLink;
  if (status === 1) {
    await updateOneTimeLink({ linkID: linkID, status: 2 });
    return null;
  } else {
    return null;
  }
};

const updateErrorLocation = ({ linkID, error }) => {
  if (linkID === undefined && error === undefined) {
    return;
  }
  let stmt = `UPDATE link_connect SET errorLocation = '${error}' WHERE linkID = '${linkID}' `;
  sql.query(stmt);
};

const updateErrorVideo = ({ linkID, error }) => {
  console.log(linkID, error);
  if (linkID === undefined && error === undefined) {
    return;
  }
  let stmt = `UPDATE link_connect SET errorVideo = '${error}' WHERE linkID = '${linkID}' `;
  console.log(stmt);
  sql.query(stmt);
};

const getUserAgent = async ({ id, linkID }) => {
  if (linkID !== undefined) {
    let stmt = `SELECT userAgent FROM link_connect WHERE linkID = '${linkID}' LIMIT 1 `;
    const resp = await sql.query(stmt);
    if (resp.length === 0) {
      return null;
    }
    if (resp.length !== 0) {
      return resp[0].userAgent;
    }
  }
  if (id !== undefined) {
    let stmt = `SELECT userAgent FROM link_connect WHERE id = '${id}' LIMIT 1 `;
    const resp = await sql.query(stmt);
    if (resp.length === 0) {
      return null;
    }
    if (resp.length !== 0) {
      return resp[0].userAgent;
    }
  }
};
const getLinkIdList = async ({ room, mobile = "" }) => {
  let stmt = `SELECT * FROM link_connect WHERE room = '${room}' AND mobile = '${mobile}' `;
  const result = await sql.query(stmt);
  if (result === undefined) {
    return null;
  }
  if (result.length === 0) {
    return null;
  }
  if (result.length === 1) {
    return result;
  }
};

const updateLinkType = async ({ room, linkType, enabled }) => {
  if (room !== undefined && enabled !== undefined && linkType !== undefined) {
    let stmt = `UPDATE link_connect SET enabled = ${enabled} WHERE room = '${room}' AND linkType = '${linkType}'`;
    const result = await sql.query(stmt);
    return result !== undefined && result.affectedRows === 1;
  }
  return null;
};

export default {
  updatePatientLocation,
  getLinkIdList,
  updateErrorVideo,
  getUserAgent,
  updateUserAgent,
  updateErrorLocation,
  getShareURL,
  createLink,
  getUserMobile,
  getOneTimeLinkStatus,
  updateOneTimeLink,
  getLinkDetail,
  updateLatLngLinkDetail,
  getSMSLinkHistory,
  getLastLatLng,
  getLatLngGroup,
  getListLinkId,
  updateLinkIDLatLng,
  checkAndUpdateOneTimeLink,
  updateLinkType,
};
