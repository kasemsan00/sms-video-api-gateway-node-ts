import dayjs from "dayjs";
import sql from "./db.service.js";
import randomString from "randomstring";

const CUSTOM_CHARSET = String(process.env.CUSTOM_CHARSET);

const createTask = async ({ mobile, room }) => {
  if (room === undefined || room === "") {
    return;
  }
  if (mobile === undefined || mobile === "") {
    return;
  }

  const customCharset = CUSTOM_CHARSET;
  const uid = randomString.generate({
    length: 6,
    charset: customCharset,
  });
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const result = await sql.query(
    `INSERT INTO car_track (room, status, dtmUpdated, mobile, uid) VALUES ('${room}', 'open', '${currentDate}', '${mobile}', '${uid}')`,
  );

  if (result && result.affectedRows > 0) {
    return uid;
  }
  return false;
};

const getTaskList = async ({ room, limit = 100 }) => {
  if (room === undefined || room === "") {
    return;
  }
  const stmt = `SELECT * FROM car_track WHERE room = '${room}' ORDER BY id DESC LIMIT ${limit}`;

  const resp = await sql.query(stmt);
  if (resp.length === 0) return false;
  return resp;
};

const cancelAllExistingTask = async ({ room }) => {
  if (room === undefined || room === "") {
    return;
  }

  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const stmt = `UPDATE car_track SET status = 'cancel', dtmUpdated = '${currentDate}', dtmCanceled = '${currentDate}' WHERE room = '${room}' AND status != 'cancel' LIMIT 100`;

  await sql.query(stmt);
};

const getCarTrackList = async ({ room }) => {
  if (room === undefined || room === "") {
    return;
  }
  const stmt = `SELECT * FROM car_track WHERE room = '${room}' ORDER BY id DESC LIMIT 100`;

  const resp = await sql.query(stmt);
  if (resp.length === 0) return false;
  return resp;
};

const getTaskDetail = async ({ uid }) => {
  if (uid === undefined || uid === "") {
    return;
  }
  const stmt = `SELECT * FROM car_track WHERE uid = '${uid}' LIMIT 1 `;

  const resp = await sql.query(stmt);
  if (resp.length === 0) return false;
  return resp[0];
};

const getUserLatLng = async ({ room }) => {
  if (room === undefined || room === "") {
    return;
  }
  const stmt = `SELECT userName ,mobile, latitude, longitude, patientLatitude, patientLongitude FROM link_connect WHERE room = '${room}' AND userType = 'user' AND mobile != '' ORDER BY id DESC LIMIT 1 `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) return false;
  return resp[0];
};

const getCarPosition = async ({ room }) => {
  if (room === undefined || room === "") {
    return;
  }
  const stmt = `SELECT * FROM car_track WHERE room = '${room}' ORDER BY id DESC LIMIT 1 `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) return false;
  return resp[0];
};

const updateCarPosition = async ({ userName, room, latitude, longitude, accuracy, speed, heading, altitude, altitudeAccuracy }) => {
  if (userName === undefined || userName === "" || room === undefined || room === "") {
    return;
  }
  const id = await getId({ room, userName });
  const defaultValues = {
    userName: "",
    room: "",
    latitude: 0,
    longitude: 0,
    speed: 0,
    heading: 0,
    altitude: 0,
    accuracy: 0,
    altitudeAccuracy: 0,
  };

  Object.keys(defaultValues).forEach((key) => {
    if (typeof eval(key) === "undefined" || eval(key) === null || eval(key) === undefined) {
      eval(`${key} = ${defaultValues[key]}`);
    }
  });
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const stmt = `INSERT INTO car_track (id, userName, room, latitude, longitude, dtmUpdated, accuracy, speed, heading, altitude, altitudeAccuracy) 
                VALUES ('${id}', '${userName}', '${room}', '${latitude}', '${longitude}', '${currentDate}', '${accuracy}', '${speed}', '${heading}', '${altitude}', '${altitudeAccuracy}')
                ON DUPLICATE KEY UPDATE 
                userName = VALUES(userName), 
                room = VALUES(room),
                latitude = VALUES(latitude), 
                longitude = VALUES(longitude), 
                dtmUpdated = VALUES(dtmUpdated),
                accuracy = VALUES(accuracy),
                speed = VALUES(speed),
                heading = VALUES(heading),
                altitude = VALUES(altitude),
                altitudeAccuracy = VALUES(altitudeAccuracy)`;

  return sql.query(stmt);
};

const updateCarPositionByUid = ({ uid, latitude, longitude, accuracy, speed, heading, altitude, altitudeAccuracy }) => {
  if (!uid) {
    console.log("Missing uid:", uid);
    return;
  }

  const params = {
    latitude: latitude || 0,
    longitude: longitude || 0,
    accuracy: accuracy || 0,
    speed: speed || 0,
    heading: heading || 0,
    altitude: altitude || 0,
    altitudeAccuracy: altitudeAccuracy || 0,
  };

  const stmt = `UPDATE car_track 
                SET latitude = '${params.latitude}', 
                    longitude = '${params.longitude}', 
                    accuracy = '${params.accuracy}', 
                    speed = '${params.speed}', 
                    heading = '${params.heading}', 
                    altitude = '${params.altitude}', 
                    altitudeAccuracy = '${params.altitudeAccuracy}',
                    dtmUpdated = NOW()
                WHERE uid = ? LIMIT 1`;
  try {
    return sql.query(stmt, [uid]);
  } catch (error) {
    console.error("Error updating car position:", error);
    throw error;
  }
};

async function getId({ room, userName }) {
  const stmt = `SELECT id FROM car_track WHERE room = '${room}' AND userName = '${userName}' ORDER BY id DESC LIMIT 1 `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) return 0;
  return resp[0].id;
}

const updateTask = async ({ uid, status }) => {
  if (uid === undefined || uid === "") {
    return;
  }

  let dateTimeField = "";
  const currentDateTime = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  switch (status) {
    case "arrive":
      dateTimeField = "dtmArrived";
      break;
    case "start":
      dateTimeField = "dtmStarted";
      break;
    case "cancel":
      dateTimeField = "dtmCanceled";
      break;
    case "complete":
      dateTimeField = "dtmCompleted";
      break;

    default:
      dateTimeField = "";
  }

  const stmt = dateTimeField
    ? `UPDATE car_track SET status = '${status}', ${dateTimeField} = '${currentDateTime}' WHERE uid = '${uid}' LIMIT 1`
    : `UPDATE car_track SET status = '${status}' WHERE uid = '${taskId}' LIMIT 1`;

  return sql.query(stmt);
};

export default {
  cancelAllExistingTask,
  createTask,
  getCarPosition,
  getCarTrackList,
  getTaskDetail,
  getTaskList,
  getUserLatLng,
  updateCarPosition,
  updateCarPositionByUid,
  updateTask,
};
