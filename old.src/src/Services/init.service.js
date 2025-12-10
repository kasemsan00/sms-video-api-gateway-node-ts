import RoomService from "./room.service.js";
import UserService from "./user.service.js";
import fs from "fs";
import logger from "../../logger.js";

const initUserExist = () => {
  UserService.initUserExist().then((r) => r);
};
const initShowEnvironment = () => {
  const { LIVEKIT_HOST, MYSQL_HOST, MYSQL_DATABASE, MYSQL_PORT } = process.env;
  logger.info("LIVEKIT HOST %s", LIVEKIT_HOST);
  logger.info("MYSQL HOST %s", MYSQL_HOST);
  logger.info("MYSQL DATABASE %s", MYSQL_DATABASE);
  logger.info("MYSQL PORT %s", MYSQL_PORT);
};

const initFolder = async () => {
  if (!fs.existsSync("./uploads")) {
    logger.info("Create Folder ./uploads");
    fs.mkdirSync("./uploads");
  }
  if (!fs.existsSync("./uploads/videos")) {
    logger.info("Create Folder ./uploads/videos");
    fs.mkdirSync("./uploads/videos");
  }
  if (!fs.existsSync("./uploads/images")) {
    logger.info("Create Folder ./uploads/images");
    fs.mkdirSync("./uploads/images");
  }
  if (!fs.existsSync("./uploads/thumbnails")) {
    logger.info("Create Folder ./uploads/thumbnails");
    fs.mkdirSync("./uploads/thumbnails");
  }
  if (!fs.existsSync("./uploads/files")) {
    logger.info("Create Folder ./uploads/files");
    fs.mkdirSync("./uploads/files");
  }
  if (!fs.existsSync("./video-record")) {
    logger.info("Create Folder ./video-record");
    fs.mkdirSync("./video-record");
  }
};
const initRoomStatus = () => {
  RoomService.updateRecordStatus({ room: "all" });
};

export default { initRoomStatus, initUserExist, initShowEnvironment, initFolder };
