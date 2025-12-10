import UsageLogService from "../Services/usageLog.service.js";
import LinkService from "../Services/link.service.js";
import logger from "../../logger.js";

const addLog = async (req, res) => {
  console.log(JSON.stringify(req.body));
  const { linkID, status, identity, log, userAgent } = req.body;
  logger.error("User Log Status:%s %s %s %s", status, identity, userAgent, log);
  UsageLogService.addStatusLog({ linkID, status, identity, data: log, userAgent });
  if (status === "ErrorLocation") {
    LinkService.updateErrorLocation({ linkID, error: log });
  }
  if (status === "ErrorVideo") {
    console.log("detect Error Video");
    LinkService.updateErrorVideo({ linkID, error: log });
  }
  return res.json({
    status: "OK",
  });
};

export default {
  addLog,
};
