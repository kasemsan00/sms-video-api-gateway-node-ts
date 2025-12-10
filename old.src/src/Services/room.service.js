import sql from "./db.service.js";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import SqlString from "sqlstring";
import randomString from "randomstring";
import logger from "../../logger.js";
import { RoomServiceClient } from "livekit-server-sdk";

const svc = new RoomServiceClient(process.env.LIVEKIT_HOST, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

const createRoom = async ({
  service = 999,
  room,
  linkType,
  autoRecord,
  recordType = "",
  encodingOptionsPreset,
  chatEnabled,
  webSocketURL,
  userAgent,
}) => {
  if (isNaN(service)) {
    service = 999;
  }
  if (room === undefined) {
    room = randomString.generate({
      length: 6,
      charset: "alphabetic",
    });
  }
  if (autoRecord === undefined) {
    autoRecord = 1;
  }
  if (chatEnabled === undefined) {
    chatEnabled = 1;
  }
  if (webSocketURL === undefined) {
    webSocketURL = "";
  }
  let status = "open";
  let type = "conference";
  if (linkType === "location") {
    status = "close";
    type = "location";
  }

  const dtmcurrent = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const dtmexpired = dayjs().add(process.env.ROOM_DAY_DEFAULT_TIMEOUT, "day").format("YYYY-MM-DD HH:mm:ss");
  logger.info("Create Room %s", room);

  const opts = {
    name: room,
    emptyTimeout: 10 * 60,
    maxParticipants: 100,
  };
  svc.createRoom(opts).then(() => {});

  const stmt = `INSERT INTO room_conference 
    (status, roomType, room, service, recordId, autoRecord, recordType, encodingOptionsPreset, chatEnabled, webSocketURL, userAgent, dtmCreated, dtmUpdated, dtmExpired) 
    VALUES ('${status}', '${type}', '${room}', ${service}, '', ${autoRecord}, '${recordType || ""}', '${encodingOptionsPreset || ""}', ${chatEnabled}, ${SqlString.escape(webSocketURL)}, ${SqlString.escape(userAgent)}, '${dtmcurrent}', '${dtmcurrent}', '${dtmexpired}')`;

  // console.log(stmt);

  const result = await sql.query(stmt);
  result.room = room;
  return result;
};
const closeRoomById = async ({ room }) => {
  if (room === undefined) {
    logger.error("Invalid room");
    return false;
  }
  const result = await sql.query(`UPDATE room_conference SET status = 'close' WHERE room = '${room}' `);
  result.room = room;
  return result;
};
const closeRoomAll = async () => {
  return sql.query(`UPDATE room_conference SET status = 'close' WHERE status = 'open'`);
};
const updateRoomStatus = async ({ room, status }) => {
  if (room === undefined) {
    return false;
  }
  if (status === undefined) {
    return false;
  }
  return sql.query(`UPDATE room_conference SET  status = '${status}', messageUnread = '0' WHERE room = '${room}' `);
};
const updateExpired = async ({ room, dtmExpired }) => {
  if (room === undefined) {
    return false;
  }
  if (dtmExpired === undefined) {
    return false;
  }
  return sql.query(`UPDATE room_conference SET dtmExpired = '${dtmExpired}' WHERE room = '${room}' `);
};
const updateRoomType = async ({
  room = undefined,
  autoRecord = undefined,
  chatEnabled = undefined,
  userAgent = "",
  webSocketURL = "",
  roomType = undefined,
}) => {
  if (room === undefined) {
    logger.error("Invalid room");
    return false;
  }
  if (autoRecord === undefined) {
    autoRecord = 1;
  }
  if (chatEnabled === undefined) {
    chatEnabled = 1;
  }
  if (roomType === undefined) {
    roomType = "conference";
  }
  const dtmCurrent = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const result = await sql.query(
    `UPDATE room_conference SET 
        roomType = '${roomType}',
        autoRecord = '${autoRecord}', 
        chatEnabled = '${chatEnabled}', 
        webSocketURL = ${SqlString.escape(webSocketURL)} , 
        userAgent = ${SqlString.escape(userAgent)},
        dtmUpdated = '${dtmCurrent}' 
        WHERE room = '${room}' `,
  );

  result.room = room;
  logger.info(
    "Update Room %s %s",
    room,
    JSON.stringify({
      autoRecord,
      chatEnabled,
      userAgent,
      webSocketURL,
    }),
  );
  return result;
};

const deleteRoom = async (room) => {
  try {
    await svc.deleteRoom(room + "").then(() => {
      logger.warn("Room %s deleted", room);
      return true;
    });
  } catch (error) {
    return error.response.data;
  }
};
const getRoomDetail = async (room) => {
  const stmt = `SELECT id, status, room, roomType, recordId, autoRecord, recordType, encodingOptionsPreset, 
    chatEnabled, messageUnread, userAgent, dtmCreated, dtmStartRecord, dtmStopRecord, webSocketURL, roomType
    FROM room_conference WHERE room = '${room}' LIMIT 0,1 `;

  const result = await sql.query(stmt);
  if (result.length > 0) {
    if (result[0].dtmStartRecord !== null) {
      let recordDuration = new Date(result[0].dtmStartRecord) - new Date();
      recordDuration = Math.abs(recordDuration);
      result[0].recordDuration = recordDuration;
    }
    return result[0];
  } else {
    return false;
  }
};

const getRoomDetailCallback = async (room, callback) => {
  const result = await sql.query(
    `SELECT status, room, recordId, autoRecord, chatEnabled, userAgent, dtmCreated, dtmStartRecord, dtmStopRecord, webSocketURL FROM room_conference WHERE room = '${room}' LIMIT 0,1 `,
  );
  if (result.length > 0) {
    if (result[0].dtmStartRecord !== null) {
      let recordDuration = new Date(result[0].dtmStartRecord) - new Date();
      recordDuration = Math.abs(recordDuration);
      result[0].recordDuration = recordDuration;
    }
    return callback(result[0]);
  } else {
    return callback(false);
  }
};
const updateTimeRoom = async (room) => {
  const dtmCurrent = dayjs().format("YYYY-MM-DD HH:mm:ss");
  sql.query(`UPDATE room_conference SET dtmUpdated = '${dtmCurrent}' WHERE room = '${room}' `);
  return true;
};
const verifyToken = async (token) => {
  try {
    return await jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return error;
  }
};
const listRooms = async () => {
  try {
    return await svc.listRooms();
  } catch (error) {
    logger.error(error.response.data);
    return false;
  }
};
const getRoomConferenceList = async ({ status = "" }) => {
  try {
    return await sql.query(`SELECT * FROM room_conference WHERE status = '${status}' `);
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const autoRoomExpiredClose = async () => {
  const AUTO_CLOSE_ROOM = process.env.AUTO_CLOSE_ROOM;
  if (AUTO_CLOSE_ROOM === "false" || AUTO_CLOSE_ROOM === "") {
    return;
  }
  const dtmCurrent = new Date();
  const result = await sql.query(`SELECT room, dtmExpired FROM room_conference WHERE status = 'open' `);
  logger.info("room open list %s", JSON.stringify(result));
  for (const data of result) {
    const expired = new Date(data.dtmExpired);
    if (dtmCurrent > expired) {
      logger.warn(`### auto room %s closed ###`, data.room);
      sql.query(`UPDATE room_conference SET status = 'close' WHERE room = '${data.room}' `);
      logger.warn(`### auto room socket %s closed ###`, data.room);
      global.io.of("/" + data.room).local.disconnectSockets();
      global.io._nsps.delete("/" + data.room);
      global.io.of("/data/" + data.room).local.disconnectSockets();
      global.io._nsps.delete("/data/" + data.room);
    }
  }
};

const checkRoomExpired = async ({ room }) => {
  const dtmCurrent = new dayjs().format("YYYY-MM-DD hh:mm:ss");
  const stmt = `SELECT room, dtmExpired FROM room_conference WHERE dtmExpired < '${dtmCurrent}' AND room = '${room}' LIMIT 1 `;
  const result = await sql.query(stmt);
  if (result === undefined) return false;
  return result.length !== 0;
};

const autoRoomSocketClose = async () => {
  const namespaces = Array.from(global.io._nsps.keys());
  logger.info("namespace list %s", JSON.stringify(namespaces));
  for (const namespace of namespaces) {
    if (namespace === "/") continue;
    if (namespace === "/queue") continue;
    if (namespace === "/newqueue") continue;
    if (namespace.startsWith("/data/")) continue;

    const room = namespace.replace("/", "");
    const respRoom = await checkRoomExpired({ room });
    if (respRoom) {
      logger.warn(`### Auto Room Socket %s closed ###`, namespace);
      global.io.of(namespace).local.disconnectSockets();
      global.io._nsps.delete(namespace);
      global.io.of("/data/" + room).local.disconnectSockets();
      global.io._nsps.delete("/data/" + room);
    }
    if (namespace === "/undefined" || namespace === "/data/undefined") {
      global.io.of(namespace).local.disconnectSockets();
      global.io._nsps.delete(namespace);
    }
  }
};

const updateRecordStatus = async ({ room, status }) => {
  let stmt = "";
  if (room === "all") {
    stmt = `UPDATE room_conference SET recordStatus = 0, recordId = ''`;
    logger.warn(`Clear Record Status`);
  } else {
    stmt = `UPDATE room_conference SET recordStatus = '${status}' WHERE room = '${room}'`;
  }
  sql.query(stmt);
  return false;
};
const setTranscriptionWebsocket = async ({ room, url }) => {
  sql.query(`UPDATE room_conference SET websocketURL = ${SqlString.escape(url)} WHERE room = '${room}' `);
  return true;
};
const updateMessageUnread = ({ room, messageUnread }) => {
  const stmt = `UPDATE room_conference SET messageUnread = '${messageUnread}' WHERE room = '${room}' `;
  sql.query(stmt);
  return true;
};
const getCountUnreadMessage = async ({ service }) => {
  const stmt = `SELECT count(*) as count FROM room_conference LEFT JOIN case_data ON case_data.roomId = room_conference.id WHERE messageUnread = '1' AND case_data.service = '${service}' `;
  const result = await sql.query(stmt);
  return result[0].count;
};
const getCaseUnreadList = async ({ service = 1 }) => {
  return sql.query(`SELECT case_data.caseId AS caseId FROM case_data 
                      LEFT JOIN room_conference ON room_conference.id = case_data.roomId 
                      WHERE room_conference.messageUnread = 1 AND case_data.service = '${service}' `);
};

const getServiceId = async ({ room }) => {
  if (room === undefined || room === null || room === "null") {
    return false;
  }
  const stmt = `SELECT case_data.service FROM case_data LEFT JOIN room_conference ON case_data.roomId = room_conference.id
                  WHERE room_conference.room = '${room}'`;

  // console.log(stmt);

  const result = await sql.query(stmt);
  if (result.length === 0) {
    return false;
  }
  return result[0].service;
};

export default {
  getServiceId,
  getCaseUnreadList,
  getCountUnreadMessage,
  updateMessageUnread,
  autoRoomSocketClose,
  autoRoomExpiredClose,
  createRoom,
  closeRoomById,
  closeRoomAll,
  updateRoomType,
  updateRoomStatus,
  updateExpired,
  deleteRoom,
  getRoomDetail,
  getRoomDetailCallback,
  getRoomConferenceList,
  listRooms,
  updateTimeRoom,
  verifyToken,
  updateRecordStatus,
  setTranscriptionWebsocket,
};
