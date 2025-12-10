import sql from "./db.service.js";
import logger from "../../logger.js";

/**
 * Build SQL filter conditions based on provided parameters
 * @param {Object} params - Filter parameters
 * @param {string} params.dateTimeStart - Start date/time
 * @param {string} params.dateTimeEnd - End date/time
 * @param {string} params.linkType - Link type filter
 * @param {string} params.userType - User type filter
 * @returns {Object} Object containing filter conditions
 */
const buildSMSFilters = ({ dateTimeStart, dateTimeEnd, linkType, userType, search, service, organization, mobile, crmSender, sortBy, sortOrder }) => {
  const filters = {
    dateTime: "",
    linkType: "",
    userType: "",
    search: "",
    service: "",
    organization: "",
    mobile: "",
    crmSender: "",
    sort: "",
  };

  // Map sortBy parameters to database column names
  const sortFieldMap = {
    dtmCreated: "link_connect.dtmCreated",
    mobile: "link_connect.mobile",
    linkType: "link_connect.linkType",
    userType: "link_connect.userType",
    service: "link_connect.service",
    organization: "case_data.organization",
  };

  // Build sort clause
  if (sortBy && sortOrder) {
    const dbField = sortFieldMap[sortBy] || "link_connect.dtmCreated";
    filters.sort = `ORDER BY ${dbField} ${sortOrder}`;
  } else {
    filters.sort = "ORDER BY link_connect.id DESC"; // Default sort
  }
  if (dateTimeStart && dateTimeEnd && dateTimeStart !== "undefined" && dateTimeEnd !== "undefined") {
    filters.dateTime = `AND link_connect.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}'`;
  }

  if (linkType && linkType !== "undefined") {
    filters.linkType = `AND link_connect.linkType = '${linkType}'`;
  }

  if (userType && userType !== "undefined") {
    filters.userType = `AND link_connect.userType = '${userType}'`;
  }

  if (search && search !== "undefined") {
    filters.search = `AND (link_connect.mobile LIKE '%${search}%' OR link_connect.crmSender LIKE '%${search}%' OR link_connect.linkType LIKE '%${search}%')`;
  }

  if (service && service !== "undefined") {
    filters.service = `AND case_data.service = '${service}'`;
  }

  if (userType && userType === "user") {
    filters.userType = `AND link_connect.userType = 'user'`;
  }

  if (organization && organization !== "undefined") {
    filters.organization = `AND case_data.organization LIKE '%${organization}%'`;
  }

  if (mobile && mobile !== "undefined") {
    filters.mobile = `AND link_connect.mobile LIKE '%${mobile}%'`;
  }

  if (crmSender && crmSender !== "undefined") {
    filters.crmSender = `AND link_connect.crmSender LIKE '%${crmSender}%'`;
  }

  return filters;
};

/**
 * Get count of SMS records with filters
 */
const getStatsCountSMS = async (params) => {
  try {
    const filters = buildSMSFilters(params);
    const query = `
      SELECT COUNT(*) AS count 
      FROM link_connect 
      LEFT JOIN room_conference ON room_conference.room = link_connect.room
      LEFT JOIN case_data ON case_data.roomId = room_conference.id
      WHERE mobile != '' AND case_data.caseId IS NOT NULL
      ${filters.dateTime} 
      ${filters.linkType} 
      ${filters.userType}
      ${filters.search}
      ${filters.service}
      ${filters.organization}
      ${filters.mobile}
      ${filters.crmSender}
    `;
    // logger.debug("SMS Count Query: %s", query);

    return await sql.query(query);
  } catch (error) {
    logger.error("Error in getStatsCountSMS: %s", error.message);
    return [{ count: 0 }];
  }
};

/**
 * Get SMS list with pagination and filters
 */
const getSMSList = async ({ limit = 100, offset = 0, ...filterParams }) => {
  try {
    const filters = buildSMSFilters(filterParams);
    const query = `
      SELECT link_connect.id, case_data.caseId, case_data.organization, link_connect.recordId, link_connect.mobile, link_connect.domainIndex, link_connect.share,
          link_connect.enabled, link_connect.userName, link_connect.room, link_connect.userType, link_connect.crmSender, link_connect.accuracy,
          link_connect.accuracy, link_connect.latitude, link_connect.longitude, link_connect.patientLatitude, link_connect.patientLongitude,
          link_connect.service, link_connect.errorVideo, link_connect.errorLocation, link_connect.os, link_connect.userAgent,
          link_connect.oneTimeLink, link_connect.dtmCreated, link_connect.dtmExpired, link_connect.linkType
      FROM link_connect
      LEFT JOIN room_conference ON room_conference.room = link_connect.room
      LEFT JOIN case_data ON case_data.roomId = room_conference.id
      WHERE mobile != '' AND case_data.caseId IS NOT NULL
      ${filters.dateTime} 
      ${filters.linkType} 
      ${filters.userType} 
      ${filters.search}
      ${filters.service}
      ${filters.organization}
      ${filters.mobile}
      ${filters.crmSender}
      ${filters.sort}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return await sql.query(query);
  } catch (error) {
    logger.error("Error in getSMSList: %s", error.message);
    return [];
  }
};

const getStatsTypeSMS = async ({ dateTimeStart, dateTimeEnd }) => {
  let dateTimeRage;
  if (dateTimeStart === undefined || dateTimeStart === "undefined") {
    dateTimeRage = "";
  } else {
    dateTimeRage = `AND link_connect.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
  }
  try {
    const stmt = `SELECT linkType, COUNT(*) AS count FROM link_connect WHERE mobile != '' ${dateTimeRage} GROUP BY linkType`;
    console.log(stmt);
    return await sql.query(stmt);
  } catch (error) {
    logger.error("%s", error.message);
    return false;
  }
};
const getStatsOSDevice = async ({ dateTimeStart, dateTimeEnd }) => {
  let dateTimeRage;
  if (dateTimeStart === undefined || dateTimeStart === "undefined") {
    dateTimeRage = "";
  } else {
    dateTimeRage = `AND link_connect.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
  }
  try {
    const stmt = `SELECT os, COUNT(*) AS COUNT  FROM link_connect WHERE mobile != '' ${dateTimeRage} GROUP BY os`;
    return await sql.query(stmt);
  } catch (error) {
    logger.error("%s", error.message);
  }
};
const getErrorVideo = async ({ dateTimeStart, dateTimeEnd }) => {
  let dateTimeRage;
  if (dateTimeStart === undefined || dateTimeStart === "undefined") {
    dateTimeRage = "";
  } else {
    dateTimeRage = `AND link_connect.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
  }
  try {
    return await sql.query(`SELECT COUNT(*) AS count  FROM link_connect WHERE mobile != '' ${dateTimeRage} AND errorVideo != ''`);
  } catch (error) {
    logger.error("%s", error.message);
  }
};
const getErrorLocation = async ({ dateTimeStart, dateTimeEnd }) => {
  let dateTimeRage;
  if (dateTimeStart === undefined || dateTimeStart === "undefined") {
    dateTimeRage = "";
  } else {
    dateTimeRage = `AND link_connect.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
  }
  try {
    return await sql.query(`SELECT COUNT(*) AS count  FROM link_connect WHERE mobile != '' ${dateTimeRage} AND errorLocation != ''`);
  } catch (error) {
    logger.error("%s", error.message);
  }
};
const getLinkConnect = async ({ os = undefined, limit = 10, dtmStart = undefined, dtmEnd = undefined }) => {
  let conditionOS = "";
  let conditionDateTime = "";
  if (os === "other") {
    conditionOS = "AND os is null";
  } else if (os === undefined) {
    console.log("AND os LIKE '%%'");
  } else {
    conditionOS = `AND os = '${os}'`;
  }
  if (dtmStart === undefined || dtmEnd === undefined) {
    conditionDateTime = "";
  } else {
    conditionDateTime = `AND (dtmCreated >= '${dtmStart} 00:00:00' AND dtmCreated <= '${dtmEnd} 23:59:59')`;
  }
  const stmt = `SELECT * FROM link_connect WHERE mobile != '' ${conditionOS} ${conditionDateTime} ORDER BY link_connect.id DESC LIMIT ${limit}`;
  return sql.query(stmt);
};

const getTrackPublished = async ({ identity = "" }) => {
  const stmt =
    `SELECT 
            JSON_EXTRACT(data, "$.event") AS EVENT, 
            JSON_EXTRACT(JSON_EXTRACT(data, "$.participant"), "$.identity") AS identity ,
            JSON_EXTRACT(JSON_EXTRACT(data, "$.room"), "$.name") AS roomName ,
            data
            FROM data_log WHERE 
            JSON_EXTRACT(JSON_EXTRACT(data, "$.participant"), "$.identity") = ` +
    '"' +
    identity +
    '" AND JSON_EXTRACT(data, "$.event") =  "track_published"';
  return sql.query(stmt);
};
const getUserListInRoom = async ({ room = "" }) => {
  const stmt = `SELECT identity FROM room_user WHERE room_user.room = '${room}' AND userType = 'user' ORDER BY id DESC `;
  return sql.query(stmt);
};
const getUserIdentity = async ({ mobile = "" }) => {
  const stmt = `SELECT identity FROM room_user WHERE room_user.userName = '${mobile}' AND userType = 'user' ORDER BY id DESC LIMIT 1`;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return null;
  } else {
    return resp[0].identity;
  }
};

export default {
  getUserIdentity,
  getUserListInRoom,
  getTrackPublished,
  getLinkConnect,
  getErrorVideo,
  getErrorLocation,
  getStatsCountSMS,
  getStatsOSDevice,
  getStatsTypeSMS,
  getSMSList,
};
