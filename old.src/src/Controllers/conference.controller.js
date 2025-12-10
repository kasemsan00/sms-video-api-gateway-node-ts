import logger from "../../logger.js";
import UserService from "../Services/user.service.js";
import UsageLogService from "../Services/usageLog.service.js";

const handleTrack = async (req, res) => {
  try {
    const data = req.body;

    logger.info("Track Muted Unmuted %s", JSON.stringify(data));
    await UserService.mutePublishedTrack({
      room: data.room,
      identity: data.identity,
      track_sid: data.trackSid,
      muted: data.isMuted,
    });
    UsageLogService.addDataLog({ data });
    global.io.of("/" + data.room).emit("track-muted-unmuted", data);

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error in handleTrack:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  handleTrack,
};
