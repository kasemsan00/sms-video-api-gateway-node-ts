import "dotenv/config";
import express from "express";
import serveIndex from "serve-index";
import http from "http";
import cors from "cors";
import Route from "./src/Routes/index.routes.js";
import RouteCustom from "./src/Custom/custom.route.js";
import SocketIOService from "./src/Socket/socketIO.service.js";
import SocketIOCarAgent from "./src/Socket/socketIO.carMobile.js";
import InitService from "./src/Services/init.service.js";
import SeedService from "./src/Seed/seed.js";
import MigrationService from "./src/Seed/migration.js";
import Crontab from "./src/Services/crontab.js";
import morgan from "morgan";
import logger from "./logger.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

global.io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

app.use(morgan("tiny", { stream: morganStream }));
app.use("/logo", express.static("./logo"));
app.use("/videos", express.static("./uploads/videos"));
app.use("/images", express.static("./uploads/images"));
app.use("/thumbnails", express.static("./uploads/thumbnails"));
app.use("/files", express.static("./uploads/files"));
app.use("/record", serveIndex("./video-record"));
app.use("/record", express.static("./video-record", { icons: true }));

app.use("/", Route);
app.use("/", RouteCustom);
app.get("/", (req, res) => {
  res.json({ message: "SMS Link Backend" });
});

async function StartServer() {
  // Seed Database and Create Tables
  await SeedService.initSeedDatabase();
  await MigrationService.runMigrations();

  // Initialize services
  Crontab.initCronJob();
  InitService.initUserExist();
  SocketIOService.initRoomSocket();
  SocketIOService.initNewQueueSocket();
  SocketIOCarAgent.initMobileDataSocket();
  InitService.initShowEnvironment();
  InitService.initFolder();
  InitService.initRoomStatus();
}

StartServer();

const port = 5500;
server.listen(port, () => {
  logger.info(`========================================`);
  logger.info(`======= Listening on port ${port} =========`);
  logger.info(`========================================`);
});
