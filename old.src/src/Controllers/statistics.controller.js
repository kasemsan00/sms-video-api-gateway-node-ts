import StatsService from "../Services/stats.service.js";
import logger from "../../logger.js";

const getStatsSummary = async (req, res) => {
  try {
    let {
      linkType,
      userType,
      dateTimeStart,
      dateTimeEnd,
      limit = 100,
      page = 1,
      search,
      service,
      organization,
      mobile,
      crmSender,
      sortBy,
      sortOrder,
    } = req.query;

    // Format dateTimeStart and dateTimeEnd if they are in date-only format
    if (dateTimeStart && /^\d{4}-\d{2}-\d{2}$/.test(dateTimeStart)) {
      dateTimeStart = `${dateTimeStart} 00:00:00`;
    }
    if (dateTimeEnd && /^\d{4}-\d{2}-\d{2}$/.test(dateTimeEnd)) {
      dateTimeEnd = `${dateTimeEnd} 23:59:59`;
    }

    // Validate and set default values for sort parameters
    const allowedSortFields = ["dtmCreated", "mobile", "linkType", "userType", "service", "organization"];
    const allowedSortOrders = ["ASC", "DESC"];

    if (sortBy && !allowedSortFields.includes(sortBy)) {
      sortBy = "dtmCreated"; // Default sort field
    }
    if (sortOrder && !allowedSortOrders.includes(sortOrder.toUpperCase())) {
      sortOrder = "DESC"; // Default sort order
    }

    // Set defaults if not provided
    if (!sortBy) sortBy = "dtmCreated";
    if (!sortOrder) sortOrder = "DESC";

    // Normalize sortOrder to uppercase
    sortOrder = sortOrder.toUpperCase();

    limit = parseInt(limit);
    page = parseInt(page);

    if (isNaN(limit) || limit <= 0) limit = 100;
    if (isNaN(page) || page <= 0) page = 1;
    if (limit > 500) {
      limit = 500;
    }

    const offset = (page - 1) * limit;

    const respCount = await StatsService.getStatsCountSMS({
      dateTimeStart,
      dateTimeEnd,
      linkType,
      userType,
      search,
      service,
      organization,
      mobile,
      crmSender,
      sortBy,
      sortOrder,
    });
    const smsList = await StatsService.getSMSList({
      limit,
      offset,
      dateTimeStart,
      dateTimeEnd,
      linkType,
      userType,
      search,
      service,
      organization,
      mobile,
      crmSender,
      sortBy,
      sortOrder,
    });

    res.json({
      count: respCount[0]?.count || 0,
      currentPage: page,
      totalPages: Math.ceil((respCount[0]?.count || 0) / limit),
      limit,
      data: smsList,
    });
  } catch (error) {
    logger.error("Error in getStatsSummary: %s", error.message);
    res.status(500).json({ error: "An error occurred while fetching statistics" });
  }
};
const getStatsDevice = async (req, res) => {
  const { dateTimeStart, dateTimeEnd } = req.query;
  const resp = await StatsService.getStatsOSDevice({
    dateTimeStart,
    dateTimeEnd,
  });
  res.json(resp);
  return;
};
const getStatsTypeSMS = async (req, res) => {
  const { dateTimeStart, dateTimeEnd } = req.query;
  const resp = await StatsService.getStatsTypeSMS({
    dateTimeStart,
    dateTimeEnd,
  });
  res.json(resp);
  return;
};
const generate = async (req, res) => {
  let { os, dtmStart, dtmEnd } = req.query;
  console.log("Datetime range", dtmStart, dtmEnd);
  const outputJSON = [];
  const nData = [];
  const linkConnectList = await StatsService.getLinkConnect({ os, limit: 999999, dtmStart, dtmEnd });
  for (const linkData of linkConnectList) {
    const data = {
      linkID: linkData.linkID,
      os: linkData.os,
      type: linkData.linkType,
      identity: "",
      dtmCreated: linkData.dtmCreated,
      location: 0,
      video: 0,
      audio: 0,
    };
    console.log("Stats linkID", linkData.linkID, linkData.dtmCreated);
    const userList = await StatsService.getUserListInRoom({ room: linkData.room });
    for (const user of userList) {
      console.log("Stats identity", user.identity);
      const trackPublishedList = await StatsService.getTrackPublished({ identity: user.identity });
      const media = {
        video: 0,
        audio: 0,
      };
      for (const trackPublished of trackPublishedList) {
        if (trackPublished.data.track.source === "CAMERA") {
          media.video = 1;
        }
        if (trackPublished.data.track.source === "MICROPHONE") {
          media.audio = 1;
        }
      }
      data.identity = user.identity;
      data.video = media.video;
      data.audio = media.audio;
    }
    if (linkData.latitude !== null && linkData.longitude !== null) {
      data.location++;
    }
    nData.push(data);
  }
  outputJSON.push(nData);
  res.json(outputJSON);
};
const user = async (req, res) => {
  const { mobile } = req.query;
  const identity = await StatsService.getUserIdentity({ mobile });
  console.log("identity :", identity);
  if (identity === null) {
    return res.json({
      message: "invalid user",
    });
  }
  const trackPublishedList = await StatsService.getTrackPublished({ identity });
  logger.info("%s", JSON.stringify(trackPublishedList));
  res.json({
    track_logs: trackPublishedList,
  });
};
export default {
  user,
  generate,
  getStatsSummary,
  getStatsDevice,
  getStatsTypeSMS,
};
