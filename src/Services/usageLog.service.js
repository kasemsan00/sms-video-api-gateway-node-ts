import exQuery from "./db.service.js";
import dayjs from "dayjs";

const addStatusLog = ({
  linkID,
  room,
  identity,
  userName,
  userType = "",
  mobile = "",
  linkType = "",
  status,
  userAgent,
  data = "",
  latitude,
  longitude,
}) => {
  if (room === undefined) {
    room = "";
  }
  if (identity === undefined) {
    identity = "";
  }
  if (userType === undefined) {
    userType = "";
  }
  if (userName === undefined) {
    userName = "";
  }
  if (mobile === undefined) {
    mobile = "";
  }
  if (linkType === undefined) {
    linkType = "";
  }
  if (status === undefined) {
    status = "";
  }
  if (userAgent === undefined) {
    userAgent = "";
  }
  if (data === undefined) {
    data = "";
  }
  if (latitude === undefined) {
    latitude = null;
  }
  if (longitude === undefined) {
    longitude = null;
  }

  try {
    data = JSON.stringify(data);
  } catch (error) {
    console.log(error);
  }
  const dtmCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");

  let sql =
    "INSERT INTO usage_status_log(linkID, room, identity, userName, userType, mobile, linkType, latitude, longitude, status, userAgent, dtmCreated, data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
  let todos = [linkID, room, identity, userName, userType, mobile, linkType, latitude, longitude, status, userAgent, dtmCreated, data];
  exQuery.query(sql, todos);
};

const getStatusLog = async ({ room }) => {
  const sql = `SELECT id, linkID, room, identity, mobile, status, userAgent, data, dtmCreated FROM usage_status_log WHERE room = '${room}' ORDER BY id DESC`;
  let result = await exQuery.query(sql);
  if (result.length > 0) {
    result.forEach((item) => {
      // console.log(item);
      try {
        item.data = JSON.parse(item.data);
      } catch (error) {
        console.log(error);
      }
    });
    return result;
  }
  return false;
};

const getCRMLinkStatusLog = async ({ linkID, room = "", linkType = "" }) => {
  let conditionUserType = "AND usage_status_log.userType = 'user'";
  if (linkType === "location") {
    conditionUserType = "";
  }
  const stmt = `
    SELECT linkID, mobile, status, linkType, usage_status_log.status, usage_status_log.dtmCreated,
    usage_status_log.userType, usage_status_log.latitude, usage_status_log.longitude, data
    FROM usage_status_log
    WHERE usage_status_log.linkID = '${linkID}' 
      AND usage_status_log.status IN ('CreateLink', 'Disconnect', 'Connection', 'GetLinkDetail', 'UpdateLatLngLinkDetail', 'MultiLatLng') 
      ${conditionUserType} 
      ORDER By usage_status_log.dtmCreated ASC LIMIT 100`;

  let result = await exQuery.query(stmt);
  if (result.length > 0) {
    for await (const item of result) {
      if (item.status === "MultiLatLng") {
        const _data = JSON.parse(item.data);
        item.currentLocation = _data.currentLocation;
        item.pickLocation = _data.pickLocation;
      }
      delete item.data;
    }
    return result;
  }
  return false;
};
const getAgent = async ({ room }) => {
  const stmt = `SELECT userName FROM link_connect WHERE room = '${room}' AND userType = 'admin' ORDER BY id ASC LIMIT 0,1`;
  let result = await exQuery.query(stmt);
  if (result.length > 0) {
    return result[0].userName;
  }
  return false;
};
const getRoomStatus = async ({ room }) => {
  const stmt = `SELECT status FROM room_conference WHERE room = '${room}' `;
  let result = await exQuery.query(stmt);
  if (result.length > 0) {
    return result[0].status;
  }
  return false;
};
const addDataLog = ({ event }) => {
  let data = JSON.stringify(event);
  const dtmCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const stmt = `INSERT INTO data_log (data, dtmCreated) VALUES (?, ?)`;
  exQuery.query(stmt, [data, dtmCreated]);
};
export default {
  addDataLog,
  getAgent,
  getRoomStatus,
  addStatusLog,
  getStatusLog,
  getCRMLinkStatusLog,
};
