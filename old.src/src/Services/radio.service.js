import sql from "./db.service.js";

const insertDevice = async ({ id, radioNo, radioName, status, serialNo }) => {
  try {
    const stmt = `
      INSERT INTO radio_devices (id, radioNo, radioName, status, serialNo)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        radioNo = VALUES(radioNo),
        radioName = VALUES(radioName),
        status = VALUES(status),
        serialNo = VALUES(serialNo)
    `;
    const params = [id, radioNo, radioName, status, serialNo];
    const result = await sql.query(stmt, params);
    return result;
  } catch (error) {
    console.error("Error inserting/updating device:", error);
    throw error;
  }
};

const insertLocation = async ({ logId, id, radioNo, radioName, accuracy, gpsDateTime, latitude, longitude, speed, emergency }) => {
  try {
    const stmt = `
      INSERT INTO radio_locations (logId, id, radioNo, radioName, accuracy, gpsDateTime, latitude, longitude, speed, emergency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        logId = VALUES(logId),
        id = VALUES(id),
        radioNo = VALUES(radioNo),
        radioName = VALUES(radioName),
        accuracy = VALUES(accuracy),
        gpsDateTime = VALUES(gpsDateTime),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        speed = VALUES(speed),
        emergency = VALUES(emergency)
    `;
    const result = await sql.query(stmt, [logId, id, radioNo, radioName, accuracy, gpsDateTime, latitude, longitude, speed, emergency]);
    return result;
  } catch (error) {
    console.error("Error inserting/updating location:", error);
    throw error;
  }
};

export default {
  insertDevice,
  insertLocation,
};
