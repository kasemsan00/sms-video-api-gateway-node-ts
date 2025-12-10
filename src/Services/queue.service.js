import sql from "./db.service.js";
import UserService from "./user.service.js";
import logger from "../../logger.js";

const getRoomQueueList = async ({ status = "" }) => {
  try {
    let queue = [];
    let stmt = `SELECT link_connect.mobile, room_conference.room, link_connect.dtmCreated as dtmUpdated
                FROM room_conference LEFT JOIN link_connect ON link_connect.room = room_conference.room 
                WHERE STATUS = '${status}' AND link_connect.userType = 'user' `;
    const rooms = await sql.query(stmt);
    for (const room of rooms) {
      // if (participants.length !== 0) {
      room.participants = await UserService.listParticipants(room.room);
      queue.push(room);
      // }
    }
    return queue;
  } catch (error) {
    logger.error(error);
    return [];
  }
};
export default {
  getRoomQueueList,
};
