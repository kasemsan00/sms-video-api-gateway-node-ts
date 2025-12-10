import logger from "../../logger.js";
import sql from "../Services/db.service.js";
const SMS_API = process.env.SMS_API_URL;
const LOCATION_API_BASE_URL = process.env.RADIO_LOCATION_API_URL;
const LOCATION_API_CREDENTIALS = {
  username: process.env.RADIO_LOCATION_API_CREDENTIALS_USERNAME,
  password: process.env.RADIO_LOCATION_API_CREDENTIALS_PASSWORD,
};
const ENCODE_API = process.env.ENCODE_API;

const encodeStream = async ({ recordId }) => {
  const url = ENCODE_API + "/record/encode";
  console.log("encode Stream", url, recordId);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recordId, hls: true }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      logger.info("Encode Stream Success:%s", JSON.stringify(data));
    })
    .catch((error) => {
      logger.error("Encode Stream Error");
      console.log(error);
    });
};

const sendDDCSMS = async ({ src, mobile, message }) => {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-api-key": "s1vEDaCmjOLMPpVz",
  };

  const data = new URLSearchParams();
  data.append("src", src);
  data.append("dst", mobile);
  data.append("message", message);

  logger.info("Send SMS Data %s", JSON.stringify({ src, mobile, message }));

  fetch(SMS_API, {
    method: "POST",
    headers: headers,
    body: data.toString(),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      logger.info("Send SMS Success:%s", JSON.stringify(data));
    })
    .catch((error) => {
      logger.error("Send SMS Error");
      console.log(error);
    });
};

async function senderName({ service = 0 }) {
  let stmt = `SELECT smsSenderName FROM services WHERE id = '${service}' LIMIT 1 `;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return "";
  }
  if (resp.length !== 0) {
    return resp[0].smsSenderName;
  }
}

const fetchLocationAPI = async (endpoint) => {
  try {
    const credentials = Buffer.from(`${LOCATION_API_CREDENTIALS.username}:${LOCATION_API_CREDENTIALS.password}`).toString("base64");

    const response = await fetch(`${LOCATION_API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Error fetching location API: ${error.message}`);
    throw error;
  }
};

const getAllDevices = async () => {
  return fetchLocationAPI("/Device");
};

const getDeviceById = async (id) => {
  return fetchLocationAPI(`/Device/${id}`);
};

const getAllLocations = async () => {
  return fetchLocationAPI("/Location");
};

const getLocationByRadioNo = async (radioNo) => {
  return fetchLocationAPI(`/Location/${radioNo}`);
};

export default {
  sendDDCSMS,
  senderName,
  getAllDevices,
  getDeviceById,
  getAllLocations,
  getLocationByRadioNo,
  encodeStream,
};
