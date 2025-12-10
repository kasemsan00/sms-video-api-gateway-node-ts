import UserService from "../../Services/user.service.js";
import RoomService from "../../Services/room.service.js";
import CarService from "../../Services/car.service.js";
import logger from "../../../logger.js";

const handleUserConnection = async (socket, connections) => {
  logger.debug("Socket ID %s Connected", socket.id);
  const namespace = socket.nsp.name.substring(1);

  const userDetail = await UserService.getUserDetail({
    room: namespace,
    identity: socket.handshake.query.identity,
  });

  if (userDetail) {
    connections.emit("user-connection", {
      camera: userDetail.camera,
      microphone: userDetail.microphone,
      identity: userDetail.identity,
      userName: userDetail.userName,
      userType: userDetail.userType,
      conference: userDetail.conference,
    });

    if (userDetail.userType === "user") {
      const pos = await CarService.getCarPosition({ room: namespace });
      if (pos !== false) {
        connections.emit("car-position", pos);
      }
    }
  }

  // Update user list
  UserService.updateSocketIOUser({
    room: namespace,
    sids: connections.adapter.sids,
  });

  // Send room details
  const roomDetail = await RoomService.getRoomDetail(namespace);
  socket.emit("connection-success", {
    status: roomDetail.status,
    room: namespace,
    recordId: roomDetail.recordId,
    dtmStartRecord: roomDetail.dtmStartRecord,
    dtmStopRecord: roomDetail.dtmStopRecord,
    recordDuration: roomDetail.recordDuration,
  });
};

export { handleUserConnection };
