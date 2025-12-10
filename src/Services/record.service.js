import dayjs from "dayjs";
import sql from "./db.service.js";
import { EgressClient, EncodedFileType, EncodingOptionsPreset } from "livekit-server-sdk";
import logger from "../../logger.js";
import RoomService from "./room.service.js";
const egressClient = new EgressClient(process.env.LIVEKIT_HOST, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

const getRecordQueue = async ({ status }) => {
  return sql.query(`
        SELECT * FROM record_queue WHERE status = '${status}'
    `);
};
const updateRecordID = async ({ room, recordId, status }) => {
  let updateTime = "";
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");

  if (status === "startRecord") {
    updateTime += ` , dtmStartRecord = '${currentDate}' `;
  } else if (status === "stopRecord") {
    updateTime += ` , dtmStopRecord =  '${currentDate}' `;
  }
  sql.query(`UPDATE room_conference SET recordId = '${recordId}' ${updateTime} WHERE room = '${room}' `);
};
const updateAllRecordID = async () => {
  sql.query(`UPDATE room_conference SET recordId = ''`);
  return true;
};
const getRecordID = async ({ room }) => {
  const data = await sql.query(`SELECT recordId FROM room_conference WHERE room = '${room}' LIMIT 0,1`);
  return data[0].recordId;
};

const autoStart = async () => {
  await getRecordQueue({ status: "pending" });
};
const startRecord = async ({
  identity = "",
  room,
  recordType = "RoomCompositeVideoAudio",
  encodingOptionsPreset = "H264_720P_30",
  audioTrackID = "",
  videoTrackID = "",
}) => {
  try {
    let ext = "mp4";
    let audioOnly = false;
    let layout = "grid";
    let info = undefined;
    let fileName = "";
    let encodingOption = EncodingOptionsPreset[encodingOptionsPreset];

    if (recordType === "RoomCompositeAudio") {
      ext = "ogg";
      audioOnly = true;
    }
    if (recordType === "RoomCompositeAudio" || recordType === "RoomCompositeVideoAudio") {
      fileName = `${Date.now()}_RoomComposite_${room}.${ext}`;
    }
    if (recordType === "TrackComposite") {
      fileName = `${Date.now()}_TrackComposite_${identity}.${ext}`;
    }

    const serviceId = await RoomService.getServiceId({ room });
    if (serviceId === null) {
      return false;
    }

    const output = {
      fileType: EncodedFileType.MP4,
      filepath: `livekit-record/` + serviceId + "/" + fileName,
    };

    logger.debug("EgressOption %s", JSON.stringify({ room, output, layout, encodingOption, audioOnly, recordType }));
    logger.debug("EgressOutput %s", JSON.stringify(output));

    switch (recordType) {
      case "RoomCompositeAudio":
      case "RoomCompositeVideoAudio":
        info = await egressClient.startRoomCompositeEgress(room, output, layout, encodingOption, audioOnly);
        break;
      case "TrackComposite":
        info = await egressClient.startTrackCompositeEgress(room, output, audioTrackID, videoTrackID);
        break;
      default:
        break;
    }
    if (info === undefined) {
      return false;
    }
    let egressID = info.egressId;
    logger.info("Record ID %s", egressID);
    info.dtmStartRecord = dayjs().format("YYYY-MM-DD HH:mm:ss");
    info.dtmStopRecord = null;
    await addRecordMedia({ egressID, room, fileName, recordType });
    return {
      status: "startRecord",
      data: info,
    };
  } catch (error) {
    logger.error("Record Error");
    logger.error("%s", error);
    return false;
  }
};
async function stopRecord({ recordId }) {
  try {
    const info = await egressClient.stopEgress(recordId);
    const datetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
    info.dtmStartRecord = null;
    info.dtmStopRecord = datetime;
    await updateRecordMedia({ egressID: info.egressId });
    return {
      status: "stopRecord",
      data: info,
    };
  } catch (error) {
    logger.error("stop record error %s", error);
    return {
      status: "ERROR",
      message: error.response.data,
    };
  }
}
const getListRecordTask = async ({ room }) => {
  try {
    return await egressClient.listEgress(room !== undefined ? room : null);
  } catch (error) {
    console.log(error);
    return false;
  }
};
const stopAllActiveRecord = async () => {
  console.log("STOP Record");
  const activeTask = await getListRecordTask({ room: undefined });
  const stopData = [];
  activeTask.forEach((task) => {
    if (task.status === 1) {
      console.log("Room", task.roomId, "RecordID", task.egressId);
      stopRecord({ room: task.roomId, recordId: task.egressId });
      stopData.push(task);
    }
  });
  return stopData;
};
async function addRecordMedia({ egressID, room, fileName, recordType = "" }) {
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  sql.query(
    `INSERT INTO record_media (egressId, room, filename, recordType, startRecord, dtmUpdated) VALUES ('${egressID}', '${room}', '${fileName}', '${recordType}', '${currentDate}', '${currentDate}')`,
  );
}
async function updateRecordMedia({ egressID }) {
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  sql.query(`UPDATE record_media SET endRecord = '${currentDate}', dtmUpdated = '${currentDate}' WHERE egressId = '${egressID}' `);
}
async function getFileHistory({ room }) {
  let condition = "";
  if (room !== undefined && room !== "") {
    condition = `WHERE room = '${room}'`;
  }
  const stmt = `SELECT * FROM record_media ${condition}`;
  return sql.query(stmt);
}
async function checkEgressAvailable() {
  const stmt = `SELECT count(*) as count FROM room_conference WHERE recordId != '' `;
  const egressLIMIT = +process.env.EGRESS_LIMIT;
  const result = await sql.query(stmt);
  console.log(`Egress Status ${result[0].count}/${egressLIMIT}`);
  return result[0].count < egressLIMIT;
}

export default {
  checkEgressAvailable,
  getFileHistory,
  autoStart,
  startRecord,
  stopRecord,
  getListRecordTask,
  stopAllActiveRecord,
  getRecordQueue,
  updateRecordID,
  updateAllRecordID,
  getRecordID,
};
