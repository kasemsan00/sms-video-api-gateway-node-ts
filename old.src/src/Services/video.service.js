import dayjs from "dayjs";
import sql from "./db.service.js";
const API_URL = process.env.API_URL;

const insertRecordMedia = async ({ egressId, room, filename, encode, recordType, fileSize, duration, filePath, uploader }) => {
  try {
    const stmt = `INSERT INTO record_media (egressId, room, filename, encode, recordType, fileSize, duration, filePath, uploader, startRecord, dtmUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      egressId,
      room,
      filename,
      encode,
      recordType,
      fileSize,
      duration,
      filePath,
      uploader,
      dayjs().format("YYYY-MM-DD HH:mm:ss"),
      dayjs().format("YYYY-MM-DD HH:mm:ss"),
    ];
    const result = await sql.query(stmt, params);
    return result;
  } catch (error) {
    console.error("Error inserting record media:", error);
    throw error;
  }
};

const getVideoList = async ({ recordType, limit = 10, page = 1, output = "list" }) => {
  try {
    // Calculate offset for pagination
    let offset = 0;
    if (page === 1) {
      offset = 0;
    } else if (page > 1) {
      offset = limit * page - limit;
    }

    // Base query without pagination for count
    let baseQuery = `FROM record_media WHERE recordType = ?`;

    // If requesting count, return total number of records
    if (output === "count") {
      const countStmt = `SELECT COUNT(*) as total ${baseQuery}`;
      const countParams = [recordType];
      const countResult = await sql.query(countStmt, countParams);
      return countResult[0]?.total || 0;
    }

    // Query with pagination for list output
    const stmt = `SELECT *, CONCAT('${API_URL}', filePath, '/', CASE WHEN hls IS NULL THEN filename ELSE hls END) as url ${baseQuery} ORDER BY startRecord DESC LIMIT ? OFFSET ?`;
    const params = [recordType, limit, offset];
    const result = await sql.query(stmt, params);
    return result;
  } catch (error) {
    console.error("Error getting video list:", error);
    throw error;
  }
};

export default {
  insertRecordMedia,
  getVideoList,
};
