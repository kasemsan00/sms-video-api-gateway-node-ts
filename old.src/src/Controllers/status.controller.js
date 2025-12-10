import UsageLogService from "../Services/usageLog.service.js";

const getStatusUsage = async (req, res) => {
  const { room } = req.query;
  const result = await UsageLogService.getStatusLog({ room });
  if (result === false) {
    res.json({
      status: "FAIL",
      message: "Invalid Room",
    });
    return null;
  }
  res.json({ status: "OK", data: result });
};
export default {
  getStatusUsage,
};
