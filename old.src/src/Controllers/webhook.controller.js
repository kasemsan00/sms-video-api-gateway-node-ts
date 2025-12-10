import RecordService from "../Services/record.service.js";
import RoomService from "../Services/room.service.js";
import dayjs from "dayjs";
import logger from "../../logger.js";
import UsageLogService from "../Services/usageLog.service.js";

const roomFinished = async ({ event }) => {
  const room = event.room.name;
  await { room: event.room.name };
  const { recordId } = await RoomService.getRoomDetail(room);
  if (recordId !== "") {
    logger.info("AutoRecord Stop Record event %s room %s egressId %s", event.event, event.room.name, recordId);
    const info = await RecordService.stopRecord({ recordId });
    logger.warn("%s %s", info.status, JSON.stringify(info.data));
  }
};
const participantJoined = async ({ event, encodingOptionsPreset, autoRecord, recordType, recordId }) => {
  if (recordId !== "") {
    logger.info("record id %s", recordId);
  }
  if (event.participant.metadata !== "") {
    if (autoRecord === 1 && recordId === "") {
      if (recordType === "RoomCompositeVideoAudio" || "RoomCompositeAudio") {
        logger.info("AutoRecord %s Record Id %s", autoRecord, recordId);
        const info = await RecordService.startRecord({ room: event.room.name, recordType, encodingOptionsPreset });
        if (info) {
          logger.info(`AutoRecord Start ${recordType} %s room %s egressId %s`, event.event, event.room.name, info.data.egressId);
        }
        if (info.status === "startRecord" && info.roomName !== undefined && info.roomName !== "undefined") {
          const connections = global.io.of("/" + info.roomName);
          connections.emit("room-record", info);
        }
      }
    }
  }
};
async function egressStarted({ event }) {
  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  logger.info("Egress start %s", JSON.stringify(event.egressInfo));
  let roomName = "";
  if (event.egressInfo.roomComposite !== undefined) {
    roomName = event.egressInfo.roomComposite.roomName;
  }
  if (event.egressInfo.trackComposite !== undefined) {
    roomName = event.egressInfo.trackComposite.roomName;
  }
  await RecordService.updateRecordID({
    room: roomName,
    recordId: event.egressInfo.egressId,
    status: "startRecord",
  });
  await RoomService.updateRecordStatus({
    room: roomName,
    status: 1,
  });
  event.egressInfo.dtmStartRecord = currentDate;
  event.egressInfo.dtmStopRecord = null;

  if (roomName !== undefined && roomName !== "undefined") {
    const connections = global.io.of("/" + roomName);
    connections.emit("room-record", event.egressInfo);
  }
}
async function egressEnded({ event }) {
  let roomName = "";
  if (event.egressInfo.roomComposite !== undefined) {
    roomName = event.egressInfo.roomComposite.roomName;
  }
  if (event.egressInfo.trackComposite !== undefined) {
    roomName = event.egressInfo.trackComposite.roomName;
  }

  const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  logger.info("Egress ended %s", JSON.stringify(event.egressInfo));
  await RecordService.updateRecordID({
    room: roomName,
    recordId: "",
    status: "stopRecord",
  });
  await RoomService.updateRecordStatus({
    room: roomName,
    status: 2,
  });
  event.egressInfo.dtmStartRecord = null;
  event.egressInfo.dtmStopRecord = currentDate;
  if (roomName !== undefined && roomName !== "undefined") {
    // const connections = global.io.of("/" + roomName);
    // connections.emit("room-record", event.egressInfo);
  }
}
const track_published_data = {};
const participantTimers = new Map();

const startInactivityTimer = (participantSid) => {
  // Set new timer (30 minutes inactivity timeout)
  const timer = setTimeout(
    () => {
      logger.info(`Participant ${participantSid} timed out due to inactivity`);
      participantTimers.delete(participantSid);
    },
    30 * 60 * 1000,
  );

  participantTimers.set(participantSid, timer);
};

const resetInactivityTimer = (participantSid) => {
  // Clear any existing timer for this participant
  if (participantTimers.has(participantSid)) {
    clearTimeout(participantTimers.get(participantSid));
  }

  // Set new timer (30 minutes inactivity timeout)
  const timer = setTimeout(
    () => {
      logger.info(`Participant ${participantSid} timed out due to inactivity`);
      participantTimers.delete(participantSid);
    },
    30 * 60 * 1000,
  );

  participantTimers.set(participantSid, timer);
};

const webHook = async (req, res) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", async () => {
    try {
      const event = JSON.parse(data);
      UsageLogService.addDataLog({ event: event });

      if (event.event === "participant_joined") {
        const participantSid = event.participant.sid;
        startInactivityTimer(participantSid);
      } else if (event.event === "participant_left") {
        const participantSid = event.participant.sid;
        clearTimeout(participantTimers.get(participantSid));
        logger.error("delete track_published_data id %s", event.participant.identity, participantSid);
        participantTimers.delete(participantSid);
      } else if (
        event.event === "track_published" || // Example activity events
        event.event === "track_subscribed" ||
        event.event === "data_received"
      ) {
        const participantSid = event.participant.sid;
        resetInactivityTimer(participantSid);
      }

      switch (event.event) {
        case "track_unpublished":
          break;
        case "track_published":
          logger.info("track_published %s", JSON.stringify(event));
          if (track_published_data[event.participant.identity] !== undefined) {
            if (event.track.source.toString() === "CAMERA") {
              track_published_data[event.participant.identity]["video"] = event.track;
            }
            if (event.track.source.toString() === "MICROPHONE") {
              track_published_data[event.participant.identity]["audio"] = event.track;
            }
            if (
              track_published_data[event.participant.identity].record === 0 &&
              track_published_data[event.participant.identity].video !== undefined &&
              track_published_data[event.participant.identity].audio !== undefined
            ) {
              logger.info(`AutoRecord Start TrackComposite %s`, event.room.name);
              RecordService.startRecord({
                identity: event.participant.identity,
                room: track_published_data[event.participant.identity].room,
                recordType: "TrackComposite",
                audioTrackID: track_published_data[event.participant.identity].audio.sid,
                videoTrackID: track_published_data[event.participant.identity].video.sid,
              }).then((r) => r);
              track_published_data[event.participant.identity].record = 1;
            }
          }

          break;
        case "track_subscribed":
          break;
        case "room_started":
          logger.info("room started %s", event.room.name);
          break;
        case "room_finished":
          await roomFinished({ event });
          break;
        case "participant_joined":
          // ######## Auto Record #######
          const { autoRecord, recordType, encodingOptionsPreset, recordId } = await RoomService.getRoomDetail(event.room.name);
          if (recordType === "TrackComposite" && track_published_data[event.participant.identity] === undefined) {
            if (!event.participant.identity.startsWith("EG_")) {
              track_published_data[event.participant.identity] = {
                room: event.room.name,
                video: undefined,
                audio: undefined,
                record: 0,
              };
            }
          }
          await participantJoined({ event, autoRecord, encodingOptionsPreset, recordType, recordId });
          break;
        case "participant_left":
          // logger.debug("delete track_published_data id %s", event.participant.identity);
          delete track_published_data[event.participant.identity];
          break;
        case "egress_started":
          // Update to database
          egressStarted({ event }).then((r) => r);
          break;
        case "egress_ended":
          // Update to database
          egressEnded({ event }).then((r) => r);
          break;
        default:
          break;
      }
    } catch (e) {
      console.log("Webhook Event Error", e);
    }
    res.writeHead(200);
    res.end();
  });
};
export default {
  participantJoined,
  roomFinished,
  egressEnded,
  egressStarted,
  webHook,
};
