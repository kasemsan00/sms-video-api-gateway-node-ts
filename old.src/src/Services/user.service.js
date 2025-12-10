import sql from "./db.service.js";
import dayjs from "dayjs";
import { customAlphabet } from "nanoid";
import SqlString from "sqlstring";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import logger from "../../logger.js";
import ShareService from "./share.service.js";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$", 10);
const svc = new RoomServiceClient(process.env.LIVEKIT_HOST, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

const getDomain = async ({ service, sender = "system", type = "", linkID = "" }) => {
  let domainPools = "";
  const respServiceDetail = await ShareService.getServiceDetail({ service, type });
  domainPools = respServiceDetail.domains;
  logger.info("Domain pools %s", domainPools);
  const stmt = `SELECT id, IFNULL(domainIndex, 0) as domainIndex FROM link_connect WHERE linkID != '${linkID}' ORDER BY link_connect.id DESC LIMIT 1`;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return domainPools[0];
  }

  let userIndex = resp[0].domainIndex;
  if (resp[0].domainIndex >= domainPools.length - 1) {
    updateIndex({ linkID, index: 0 });
    return domainPools[0];
  }
  userIndex++;
  updateIndex({ linkID, index: userIndex });
  return domainPools[userIndex];

  function updateIndex({ linkID, index }) {
    const stmt = `UPDATE link_connect SET domainIndex='${index}' WHERE linkID = '${linkID}' `;
    sql.query(stmt);
  }
};

const addUser = async ({ room, identity, userName, userType = "user", socketId = "", status = "join", color, conference, userAgent }) => {
  const respIsUserInRoom = await isUserInRoom({ room, identity });

  if (conference === undefined) {
    conference = 1;
  }
  if (respIsUserInRoom === 0) {
    logger.info("Add User identity %s %s", identity, userName);
    const dtmcurrent = dayjs().format("YYYY-MM-DD HH:mm:ss");
    await sql.query(`
			INSERT INTO room_user (
        userAgent,
				room, 
				identity, 
                color,
				userName, 
				userType, 
				status,
				socketId,
                conference,
				dtmCreated, 
				dtmUpdated
			) 
			VALUES (
        '${userAgent}',
				'${room}', 
				'${identity}', 
                '${color}',
				'${userName}', 
				'${userType}', 
				'${status}',
				'${socketId}',
                '${conference}',
				'${dtmcurrent}', 
				'${dtmcurrent}'
			)`);
  } else {
    logger.warn("Update User room %s identity %s userName %s", room, identity, userName);
    await sql.query(`
			UPDATE room_user 
			SET 
				userName = '${userName}', 
				userType = '${userType}' 
			WHERE 
				room = '${room}' AND
				identity = '${identity}'
		`);
  }
};

const updateUser = ({ linkID, room, identity, userName, color, socketId }) => {
  let updateCondition = "";
  if (socketId !== undefined) {
    updateCondition += `, socketId = ${SqlString.escape(socketId)}`;
  }
  if (color !== undefined) {
    updateCondition += `, color = '${color}'`;
  }
  const stmt1 = `
    UPDATE room_user SET userName = ${SqlString.escape(userName)} ${updateCondition}
    WHERE room = '${room}' AND identity = '${identity}'
  `;
  sql.query(stmt1);
  if (linkID === undefined) {
    return;
  }
  const stmt2 = `
    UPDATE link_connect SET userName = ${SqlString.escape(userName)}
    WHERE linkID = '${linkID}'
  `;
  sql.query(stmt2);
};

const updateUserType = async ({ room, identity, userType }) => {
  sql.query(`
		UPDATE room_user SET userType = '${userType}' WHERE room = '${room}' AND identity = '${identity}'
	`);
};

const updateUserStatus = ({ room, identity, status }) => {
  sql.query(`
		UPDATE room_user SET status = '${status}', camera = 1, microphone = 1 WHERE room = '${room}' AND identity = '${identity}'
	`);
};
const updateUserAgent = ({ identity, room, userAgent }) => {
  sql.query(`
		UPDATE room_user SET userAgent = '${userAgent}' WHERE room = '${room}' AND identity = '${identity}'
	`);
};

const generateUser = async ({
  linkID,
  linkType,
  mobile,
  room,
  identity,
  userName,
  userType,
  roomJoin = true,
  isAddUser = true,
  color = undefined,
  conference,
  userAgent,
}) => {
  color = await getColor(color);

  try {
    if (identity === undefined || identity === "null") {
      identity = userType === "viewer" ? `viewer_${nanoid()}` : nanoid();
    }
    if (userType === undefined) {
      userType = "user";
    }

    if (userName === "") {
      userName = generateGuestName();
    }
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: identity,
      name: userName,
      metadata: JSON.stringify({
        userName: userName,
        userType: userType,
        color: color,
        linkType: linkType,
        mobile: mobile,
        linkID: linkID,
      }),
    });
    at.addGrant({
      roomJoin: roomJoin,
      room: room,
      name: userName,
      canPublishData: true,
      canPublish: true,
      canSubscribe: true,
      roomList: true,
    });
    if (isAddUser === true) {
      await addUser({ room, identity, userName, userType, color, conference, userAgent });
    } else {
      updateUserAgent({ identity, room, userAgent });
    }
    const token = await at.toJwt();

    return { identity, userName, token, conference, color };
  } catch (error) {
    logger.error(error);
    return false;
  }
};
function generateUserName() {
  return "User-" + Math.floor(Math.random() * 100);
}
function generateGuestName() {
  return "Guest-" + Math.floor(Math.random() * 100);
}
const generateUserJoinConference = async ({ room, userName, socketId }) => {
  console.log("Generate User Join Conference");
  const identity = nanoid();
  if (userName === undefined || userName === "") {
    userName = generateUserName();
  }
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: identity,
    name: userName,
    metadata: JSON.stringify({
      userName: userName,
      userType: "user",
    }),
  });
  at.addGrant({
    name: userName,
    roomJoin: true,
    room: room,
    canPublishData: true,
    canPublish: true,
    canSubscribe: true,
    roomList: true,
  });

  // update id and username
  await sql.query(`UPDATE room_user SET identity = '${identity}', userName = '${userName}', status = 'join' WHERE socketId = '${socketId}'`);

  const token = await at.toJwt();
  return { identity, token };
};
const getUserRoomAdmin = async (room) => {
  return sql.query(`
    SELECT socketId
    FROM room_user
    WHERE room = '${room}'
      AND userType = 'admin'
      AND socketId != '' `);
};
const updateUserCamera = async ({ identity, camera }) => {
  return sql.query(`UPDATE room_user
                    SET camera = ${camera}
                    WHERE identity = '${identity}' `);
};
const updateUserMicrophone = async ({ identity, microphone }) => {
  return sql.query(`UPDATE room_user
                    SET microphone = ${microphone}
                    WHERE identity = '${identity}' `);
};
const updateUserConference = async ({ identity, conference }) => {
  return sql.query(`UPDATE room_user
                    SET conference = ${conference}
                    WHERE identity = '${identity}' `);
};
const updateUserDisconnect = async (socketId) => {
  return sql.query(`UPDATE room_user
                    SET socketId  = '',
                        camera=1,
                        microphone=1
                    WHERE socketId = '${socketId}' `);
};
const updateUserParticipant = async (room, identity, userName) => {
  try {
    return await svc.updateParticipant(
      room,
      identity,
      JSON.stringify({
        userName: userName,
      }),
    );
  } catch (error) {
    logger.error("updateUserParticipant %s", error.response.data);
    return error.response.data;
  }
};
const getUserDetail = async ({ room, identity, socketId }) => {
  let condition = "";

  if (room === undefined && socketId === undefined) {
    return false;
  }
  if (room !== undefined && identity !== undefined) {
    condition += ` room = '${room}' AND identity = '${identity}' `;
  }
  if (socketId !== undefined && socketId !== "") {
    condition += ` socketId = '${socketId}' `;
  }

  if (condition === "") {
    return false;
  }
  const stmt = `SELECT room, identity, color, userName, status, camera, microphone, userType, conference FROM room_user WHERE ${condition} LIMIT 0,1`;
  const result = await sql.query(stmt);
  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};
const getUserDetailCallback = ({ room, identity, socketId }, callback) => {
  let condition = "";
  if (room === undefined && socketId === undefined) {
    return false;
  }
  if (room !== undefined && identity !== undefined) {
    condition += ` room = '${room}' AND identity = '${identity}' `;
  }
  if (socketId !== undefined) {
    condition += ` socketId = '${socketId}' `;
  }
  const stmt = `SELECT room, identity, color, camera, microphone, userName, status, camera, microphone, userType, conference 
    FROM room_user 
    WHERE ${condition} LIMIT 0,1`;

  sql.query(stmt, (err, result) => {
    if (err !== null) return false;
    if (result.length > 0) {
      return callback(result[0]);
    } else {
      return callback(false);
    }
  });
};

const checkUserExistFromLinkID = async ({ linkID }) => {
  return sql.query(`
    SELECT link_connect.room, room_user.identity
    FROM link_connect
           LEFT JOIN room_conference ON link_connect.room = room_conference.room
           LEFT JOIN room_user ON room_user.room = link_connect.room
    WHERE link_connect.linkID = '${linkID}'
  `);
};

const getUserAlreadyInRoom = async (room, identity) => {
  const resultCount = await sql.query(`SELECT count(*) as count FROM room_user WHERE room = '${room}' AND identity = '${identity}'`);
  return resultCount[0].count !== 0;
};
const getUserAlreadyConnected = async (room, identity) => {
  try {
    return await svc.getParticipant(room, identity);
  } catch (error) {
    return error.response.data;
  }
};
const listParticipants = async (room) => {
  try {
    const result = await svc.listParticipants(room);
    return result;
  } catch (error) {
    console.log(error);
    logger.error(error.toString());
    return false;
  }
};

const removeParticipant = async ({ room, identity }) => {
  if (room === undefined || identity === undefined) {
    return;
  }
  logger.warn("RemoveParticipant Room %s identity %s", room, identity);
  svc
    .removeParticipant(room, identity)
    .then(() => {})
    .catch((error) => {
      if (error.code !== undefined) {
        logger.error("error code %s", error.code);
      }
      if (error.code !== "ECONNREFUSED" && error.response !== undefined) {
        logger.error("RemoveParticipant %s", error.response.data);
      }
    });
};
const mutePublishedTrack = async ({ room, identity, track_sid, muted }) => {
  try {
    logger.info("MutedPublishedTrack track_sid %s muted %s", track_sid, muted);
    return await svc.mutePublishedTrack(room, identity, track_sid, muted);
  } catch (error) {
    logger.error("MutedPublishedTrack", error.response.data);
    return false;
  }
};

async function getUserCameraMicrophoneStatus({ room, identity }) {
  if (room === undefined) return null;
  if (identity === undefined) return null;
  const result = await sql.query(`SELECT cameraMicrophoneStatus FROM room_user WHERE room = '${room}' AND identity = '${identity}' LIMIT 1`);
  if (result.length !== 0) {
    return result[0].cameraMicrophoneStatus;
  }
  return null;
}
function updateUserCameraMicrophoneStatus({ room, identity, status }) {
  if (room === undefined) return;
  if (identity === undefined) return;
  sql.query(`UPDATE room_user SET cameraMicrophoneStatus = '${status}' WHERE room = '${room}' AND identity = '${identity}'`);
}

async function isUserInRoom({ room, identity }) {
  const result = await sql.query(`SELECT count(*) as count FROM room_user WHERE room = '${room}' AND identity = '${identity}'`);
  try {
    return result[0].count;
  } catch (error) {
    logger.error(error);
  }
}
const listUserInRoom = async (room, status) => {
  const result = await sql.query(`
        SELECT identity, userName, camera, microphone, userType, conference 
        FROM room_user 
        WHERE room = '${room}' AND status = 'connection' 
    `);
  try {
    return result;
  } catch (error) {
    logger.error(error);
  }
};
const listUserInRoomCallback = async (room, status, callback) => {
  const result = await sql.query(`
        SELECT identity, userName, camera, microphone, userType, conference 
        FROM room_user 
        WHERE room = '${room}' AND status = 'connection' 
    `);
  callback(result);
};
const initUserExist = async () => {
  sql.query(`UPDATE room_user SET status = 'disconnect' WHERE status = 'connection' `);
};

const updateTimeRoom = async (room) => {
  const dtmCurrent = dayjs().format("YYYY-MM-DD HH:mm:ss");
  sql.query(`UPDATE room_conference SET dtmUpdated = '${dtmCurrent}' WHERE room = '${room}' `);
  return true;
};
const getSocketIdFromIdentity = async (identity) => {
  const result = await sql.query(`SELECT socketId FROM room_user WHERE identity = '${identity}' `);
  try {
    if (result) {
      return result[0].socketId;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error);
  }
};
async function getColor(color) {
  if (color !== undefined) {
    return color;
  }
  const result = await sql.query(`SELECT color_hex FROM color_scheme ORDER BY RAND ( ) LIMIT 1`);
  return result[0].color_hex;
}

const updateSocketIOUser = async ({ room, sids }) => {
  // let _sids = [];
  // for (const sid of sids) {
  //   _sids.push(sid[0]);
  // }
  // const listUser = await module.exports.listUserInRoom(room, "connection");
  // let userDisconnect = [];
  // console.log("---------------------");
  // for (let user in listUser) {
  //   if (_sids.indexOf(listUser[user].identity) === -1) {
  //   } else {
  //     userDisconnect.push(listUser[user].identity);
  //     sql.query(
  //       `UPDATE room_user SET status = 'disconnect', camera = '1', microphone = '1' WHERE room = '${room}' AND identity = '${listUser[user].identity}' `,
  //     );
  //   }
  // }
  // console.log("userDisconnect", userDisconnect);
  // console.log("---------------------");
  // if (sids.size === 0) {
  //   sql.query(`UPDATE room_user SET status = 'disconnect', camera = '1', microphone = '1' WHERE room = '${room}'`);
  // }
};
const agentList = async ({ room }) => {
  const stmt = `SELECT count(*) as count FROM room_user WHERE userType = 'admin' AND room = '${room}' AND status = 'connection'  `;
  const result = await sql.query(stmt);
  return result[0].count;
};

const getUserAgent = async ({ identity }) => {
  let stmt = `SELECT userAgent FROM room_user WHERE room_user.identity = '${identity}' ORDER BY room_user.id DESC LIMIT 1 `;
  console.log(stmt);
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return null;
  }
  if (resp.length !== 0) {
    return resp[0].userAgent;
  }
};

export default {
  getUserAgent,
  getColor,
  agentList,
  generateUser,
  generateUserJoinConference,
  getUserRoomAdmin,
  checkUserExistFromLinkID,
  addUser,
  updateSocketIOUser,
  updateUser,
  updateUserType,
  updateUserStatus,
  updateUserMicrophone,
  updateUserCamera,
  updateUserConference,
  updateUserDisconnect,
  updateUserParticipant,
  updateUserCameraMicrophoneStatus,
  getUserDetail,
  getUserDetailCallback,
  getUserAlreadyConnected,
  getUserAlreadyInRoom,
  listParticipants,
  removeParticipant,
  initUserExist,
  listUserInRoom,
  listUserInRoomCallback,
  updateTimeRoom,
  mutePublishedTrack,
  isUserInRoom,
  getSocketIdFromIdentity,
  generateUserName,
  getDomain,
};
