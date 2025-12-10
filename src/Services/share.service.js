import logger from "../../logger.js";
import sql from "./db.service.js";

const getServiceDetail = async ({ service, type }) => {
  if (type === undefined) {
    logger.info("Type is undefined, default to video");
    type = "video";
  }
  const stmt = `SELECT id, prefixTextVideoSMS, prefixTextLocationSMS, domainsVideo, domainsLocation, prefixHLSVideoSMS FROM services WHERE id = '${service}'`;

  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return null;
  }
  if (type === "video") {
    return { domains: resp[0].domainsVideo.split(","), prefixTextSMS: resp[0].prefixTextVideoSMS };
  }
  if (type === "location") {
    return { domains: resp[0].domainsLocation.split(","), prefixTextSMS: resp[0].prefixTextLocationSMS };
  }
  if (type === "hls") {
    return { domains: resp[0].domainsVideo.split(","), prefixTextSMS: resp[0].prefixHLSVideoSMS };
  }
  return null;
};

export default { getServiceDetail };
