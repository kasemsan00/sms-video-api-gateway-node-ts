import { CronJob } from "cron";
import RoomService from "./room.service.js";

const initCronJob = async () => {
  // Cronjob every hours
  new CronJob("0 * * * *", RoomService.autoRoomExpiredClose, null, true, "Asia/Bangkok");
  new CronJob("0 * * * *", RoomService.autoRoomSocketClose, null, true, "Asia/Bangkok");
};

export default { initCronJob };
