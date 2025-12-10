import logger from "../../logger.js";
import sql from "./db.service.js";
import dayjs from "dayjs";

const create = async ({ caseId, service, roomId = null, userName, mobileCreated = "", caseType = "", organization = "" }) => {
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const stmt = `INSERT INTO case_data (caseId, service, roomId, status, userName, mobileCreated, caseType, dtmCreated, organization) VALUES ('${caseId}', '${service}', ${roomId} , 'On Case', '${userName}', '${mobileCreated}', '${caseType}', '${currentDate}', '${organization}')`;

  return sql.query(stmt);
};
const getLastCaseId = async ({ service }) => {
  const stmt = `SELECT caseId FROM case_data WHERE service = '${service}'  ORDER By id DESC LIMIT 1`;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return 0;
  }
  return resp[0].caseId;
};
const getDetail = async ({ service, caseId }) => {
  const stmt = `SELECT * FROM case_data WHERE caseId = '${caseId}' AND service = '${service}' `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return false;
  }
  if (resp.length !== 0) {
    return resp[0];
  }
};
const getRoomName = async ({ caseId, service }) => {
  const stmt = `SELECT room_conference.room FROM case_data   
    LEFT JOIN room_conference ON case_data.roomId = room_conference.id
    WHERE case_data.caseId = '${caseId}' AND case_data.service = '${service}'`;

  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return false;
  }
  if (resp.length !== 0) {
    return resp[0].room;
  }
};

const getCaseDetail = async ({ room }) => {
  if (room === undefined || room === null || room === "null") {
    return false;
  }
  const stmt = `SELECT case_data.service, case_data.caseId, case_data.operationNumber, case_data.hn, case_data.patientMobile, case_data.userName, case_data.mobileCreated, case_data.dtmCreated, case_data.status FROM case_data LEFT JOIN room_conference ON case_data.roomId = room_conference.id
                  WHERE room_conference.room = '${room}'`;

  const result = await sql.query(stmt);
  if (result.length === 0) {
    return false;
  }
  return result[0];
};

const update = async ({
  service,
  operationNumber = undefined,
  roomId = undefined,
  caseId = undefined,
  status = undefined,
  hn = undefined,
  patientMobile = undefined,
  userName = undefined,
}) => {
  logger.info("Case update %s %s %s", roomId, caseId, service);

  if (operationNumber === null) {
    operationNumber = "";
  }
  if (hn === null) {
    hn = "";
  }
  if (patientMobile === null) {
    patientMobile = "";
  }
  if (caseId === undefined) {
    return false;
  }
  if (operationNumber !== undefined) {
    await sql.query(`UPDATE case_data SET operationNumber = '${operationNumber}' WHERE caseId = '${caseId}' AND service = '${service}' `);
  }
  if (userName !== undefined) {
    await sql.query(`UPDATE case_data SET userName = '${userName}' WHERE caseId = '${caseId}' AND service = '${service}' `);
  }
  if (roomId !== undefined) {
    await sql.query(`UPDATE case_data SET roomId = '${roomId}' WHERE caseId = '${caseId}' AND service = '${service}' `);
  }
  if (status !== undefined) {
    await sql.query(`UPDATE case_data SET status = '${status}' WHERE caseId = '${caseId}' AND service = '${service}' `);
  }
  if (hn !== undefined && patientMobile !== undefined) {
    await sql.query(`UPDATE case_data SET hn = '${hn}', patientMobile = '${patientMobile}' WHERE caseId = '${caseId}' AND service = '${service}' `);
  }
  return true;
};
const getCaseHistory = async ({
  service,
  text = "",
  operationNumber = "",
  caseId = "",
  hn = "",
  isStatusClosed = "true",
  isStatusOnCase = "true",
  isStatusProcess = "true",
  mobileCreated = "",
  patientMobile = "",
  dateTimeStart = "",
  dateTimeEnd = "",
  type = "",
  output = "list",
  page,
  limit,
}) => {
  let OFFSET = 0;
  let conditionLimitOffset = "";
  if (page === 1) {
    OFFSET = 0;
  }
  if (page > 1) {
    OFFSET = limit * page - limit;
  }
  if (output === "list") {
    conditionLimitOffset = `LIMIT ${limit} OFFSET ${OFFSET}`;
  }
  text = text.trim();
  if (type === "" || type === "searchAll") {
    let stmt = "";
    if (type === "") {
      stmt = `SELECT case_data.caseId as caseId, operationNumber,hn, patientMobile, mobileCreated, case_data.dtmCreated, 
                room_conference.messageUnread,case_data.status 
                FROM case_data LEFT JOIN room_conference ON room_conference.id = case_data.roomId
                WHERE case_data.service = '${service}'
                ORDER BY case_data.caseId DESC ${conditionLimitOffset}`;
    }
    if (type === "searchAll") {
      stmt = `SELECT case_data.caseId as caseId, operationNumber, hn, patientMobile, mobileCreated, case_data.dtmCreated, 
                room_conference.messageUnread,case_data.status 
                FROM case_data LEFT JOIN room_conference ON room_conference.id = case_data.roomId 
                WHERE 
                  case_data.service = '${service}' AND
                  case_data.caseId LIKE '%${text}%' OR
                  case_data.operationNumber LIKE '%${text}%' OR
                  case_data.hn LIKE '%${text}%' OR
                  case_data.patientMobile LIKE '%${text}%' OR
                  case_data.mobileCreated LIKE '%${text}%' OR
                  case_data.dtmCreated LIKE '%${text}%' OR
                  case_data.status LIKE '%${text}%'
                ORDER BY case_data.caseId DESC ${conditionLimitOffset}`;
    }
    const result = await sql.query(stmt);
    if (result === undefined) {
      return undefined;
    }
    if (result.length === 0) {
      return undefined;
    }
    if (output === "list") {
      return result;
    }
    if (output === "count") {
      return result.length;
    }
  }

  if (type === "searchAdvanced") {
    let stmt = "";
    let conditionOperationNumber = "";
    let conditionHn = "";
    let conditionCaseId = "";
    let conditionMobileCreated = "";
    let conditionPatientMobile = "";
    let conditionCaseStatus = "";
    let conditionDateTimeRange = "";
    conditionCaseStatus = ` case_data.status in (
    '${isStatusOnCase === "true" && "On Case"}', 
    '${isStatusProcess === "true" && "Process"}',
    '${isStatusClosed === "true" && "Closed"}'
    )`;

    if (isStatusOnCase === "false" && isStatusProcess === "false" && isStatusClosed === "false") {
      conditionCaseStatus = " case_data.status not in ('On Case', 'Process', 'Closed')";
    }
    if (dateTimeStart !== "" && dateTimeEnd !== "") {
      conditionDateTimeRange = `AND case_data.dtmCreated BETWEEN '${dateTimeStart}' AND '${dateTimeEnd}' `;
    }
    if (operationNumber.trim() !== "") {
      conditionOperationNumber = ` AND case_data.operationNumber LIKE '%${operationNumber}%' `;
    }
    if (caseId.trim() !== "") {
      conditionCaseId = ` AND case_data.caseId LIKE '%${caseId}%' `;
    }
    if (hn.trim() !== "") {
      conditionHn = ` AND hn LIKE '%${hn}%' `;
    }
    if (mobileCreated.trim() !== "") {
      conditionMobileCreated = ` AND mobileCreated LIKE '%${mobileCreated}%' `;
    }
    if (patientMobile.trim() !== "") {
      conditionPatientMobile = ` AND patientMobile LIKE '$${patientMobile}$'`;
    }

    stmt = `SELECT case_data.caseId as caseId, operationNumber, hn, patientMobile, mobileCreated, case_data.dtmCreated, 
            room_conference.messageUnread,case_data.status 
            FROM case_data LEFT JOIN room_conference ON room_conference.id = case_data.roomId 
            WHERE 
            case_data.service = '${service}' AND
            ${conditionCaseStatus} 
            ${conditionDateTimeRange} 
            ${conditionOperationNumber}
            ${conditionCaseId} 
            ${conditionHn}
            ${conditionMobileCreated} 
            ${conditionPatientMobile}
            ORDER BY case_data.caseId DESC ${conditionLimitOffset}`;

    const result = await sql.query(stmt);
    if (result === undefined) {
      return undefined;
    }
    if (result.length === 0) {
      return undefined;
    }
    if (output === "count") {
      return result.length;
    } else {
      return result;
    }
  }
};
export default {
  getCaseDetail,
  getLastCaseId,
  create,
  getDetail,
  getRoomName,
  update,
  getCaseHistory,
};
