import RecordService from "../Services/record.service.js";
import UsageLogService from "../Services/usageLog.service.js";

const requestRecord = async (req, res) => {
  if (req.query.room === "" || req.query.room === undefined) {
    res.json({
      status: "FAIL",
      message: "invalid query",
    });
    return null;
  }
  const currentRecordId = await RecordService.getRecordID({ room: req.query.room });
  if (currentRecordId === "") {
    const recordResponse = await RecordService.startRecord({
      room: req.query.room,
    });
    if (recordResponse.status === "OK") {
      UsageLogService.addStatusLog({
        room: req.query.room,
        identity: req.query.identity,
        status: "StartRecord",
        userAgent: req.headers["user-agent"].toString(),
        data: recordResponse.data,
      });
      console.log("new record");
      res.json({
        status: "OK",
        message: "start record",
        data: recordResponse.data,
      });
    } else {
      console.log("fail record", recordResponse.data);
      UsageLogService.addStatusLog({
        room: req.query.room,
        identity: req.query.identity,
        status: "FailRecord",
        userAgent: req.headers["user-agent"].toString(),
        data: recordResponse.data,
      });
      res.json({
        status: "FAIL",
        message: recordResponse.data,
      });
    }
  } else {
    console.log("stop record");
    const info = await RecordService.stopRecord({ room: req.query.room, recordId: currentRecordId });
    UsageLogService.addLog({
      room: req.query.room,
      identity: req.query.identity,
      status: "StopRecord",
      userAgent: req.headers["user-agent"].toString(),
      data: info.data,
    });
    res.json({
      status: "OK",
      message: "stop record",
      data: info.data,
    });
  }
};
const listRecordTask = async (req, res) => {
  const result = await RecordService.getListRecordTask({ room: req.body.room });
  if (result) {
    res.json({
      status: "OK",
      data: result,
    });
  } else {
    res.json({
      status: "FAIL",
    });
  }
};
const stopAllRecordTask = async (req, res) => {
  const stopDataTask = await RecordService.stopAllActiveRecord();
  res.json({
    status: "OK",
    message: stopDataTask.length === 0 ? "no task stop" : "",
    data: stopDataTask,
  });
};
const checkRecordAvailable = async (req, res) => {
  const egressStatus = await RecordService.checkEgressAvailable();
  if (!egressStatus) {
    return res.json({
      status: "FAIL",
      message: "Record service not available",
    });
  } else {
    return res.json({
      status: "OK",
      message: "Record service is ready",
    });
  }
};

export default {
  checkRecordAvailable,
  requestRecord,
  listRecordTask,
  stopAllRecordTask,
};
