import Room from "../Services/room.service.js";
import User from "../Services/user.service.js";
import LinkService from "../Services/link.service.js";
import UsageLogService from "../Services/usageLog.service.js";
import CaseService from "../Services/case.service.js";
import logger from "../../logger.js";

const getRoomDetail = async (req, res) => {
  const result = await Room.getRoomDetail(req.query.room);
  if (result) {
    res.json({
      status: "OK",
      data: result,
    });
  } else {
    res.json({
      status: "OK",
      data: {
        status: "invalid_room",
      },
    });
  }
};
const listRooms = async (req, res) => {
  const result = await Room.listRooms();
  res.json(result);
};

const deleteRoom = async (req, res) => {
  const result = await Room.deleteRoom(req.body.room);
  if (result === undefined) {
    res.json({
      status: "OK",
      message: `Room ${req.body.room} deleted`,
    });
  } else {
    res.json({
      status: "FAIL",
      message: result,
    });
  }
};
const verifyToken = async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const result = await Room.verifyToken(token);
  try {
    if (result.video.roomJoin === true) {
      res.json({
        status: "OK",
        data: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "FAIL",
      data: result,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    console.log("VerifyUser room", req.decoded.video.room, "identity", req.decoded.sub);
    const isUserAlreadyConnected = await User.getUserAlreadyConnected(req.decoded.video.room, req.decoded.sub);
    const { userName, userType, status } = await User.getUserDetail({ room: req.body.room, identity: req.decoded.sub });

    if (isUserAlreadyConnected.msg === "participant does not exist") {
      console.log("User Status", status);
      if (status === "wait") {
        res.json({
          status: "FAIL",
        });
      } else {
        const metadata = JSON.parse(req.decoded.metadata);
        const isUserInRoom = await User.isUserInRoom({
          room: req.body.room,
          identity: req.decoded.sub,
        });
        console.log("Is User in room", isUserInRoom);

        if (req.body.room !== req.decoded.video.room) {
          if (isUserInRoom !== 0) {
            const data = await User.generateUser({
              room: req.body.room,
              identity: req.decoded.sub,
              userName: userName,
              userType: userType,
              roomJoin: req.decoded.video.roomJoin,
            });
            res.json({
              status: "OK",
              data: data,
            });
          } else {
            res.json({
              status: "FAIL",
              data: {
                message: "no user in room",
              },
            });
          }
        } else if (metadata.userName !== userName && isUserInRoom > 0) {
          const data = await User.generateUser({
            room: req.decoded.video.room,
            userName: userName,
            userType: userType,
            roomJoin: req.decoded.video.roomJoin,
          });
          res.json({
            status: "OK",
            data: data,
          });
        } else {
          if (isUserInRoom === 0) {
            res.json({
              status: "FAIL",
            });
          } else {
            res.json({
              status: "OK",
              data: {
                identity: req.decoded.sub,
                token: req.headers.authorization.replace("Bearer ", ""),
              },
            });
          }
        }
      }
    } else {
      const data = await User.generateUser({
        room: req.decoded.video.room,
        userName: userName,
        userType: userType,
        roomJoin: req.decoded.video.roomJoin,
      });
      res.json({
        status: "OK",
        data: data,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const updateRoomStatus = async (req, res) => {
  const { caseId, service, status } = req.body;
  if (caseId === undefined || status === undefined) {
    res.send(404).send("Invalid parameter");
  }
  const roomName = await CaseService.getRoomName({
    caseId,
    service,
  });
  const respUpdate = await Room.updateRoomStatus({
    room: roomName,
    status,
  });
  logger.info("Update room status %s", JSON.stringify(respUpdate));
  res.json({ status: status });
};
const updateRoomType = async (req, res) => {
  const { room, roomType, identity } = req.body;
  logger.info("Update room type req %s", JSON.stringify(req.body));
  if (room === undefined) {
    return res.status(404).send("Invalid Room");
  }
  const respUpdate = await Room.updateRoomType({ room, roomType, identity });
  logger.info("Update room %s %s %s %s", identity, room, roomType, JSON.stringify(respUpdate));
  const respLog = {
    status: "roomUpdate",
    room,
    roomType,
  };
  global.io.of(room).emit("room-data", respLog);
  UsageLogService.addStatusLog({
    identity,
    room,
    data: `Update room ${identity} ${room} ${roomType} `,
  });
  return res.json({ status: "roomUpdate", room, roomType });
};

const closeRoom = async (req, res) => {
  const { room } = req.body;
  const resp = await Room.closeRoomById({ room });
  if (resp.affectedRows === 1) {
    const connections = global.io.of("/queue");
    const smsLinkHistory = await LinkService.getSMSLinkHistory({ roomName: room });
    if (smsLinkHistory[0].length !== 0) {
      connections.emit("queue", {
        status: "closeRoom",
        data: smsLinkHistory[0],
      });
    }
    global.io.of("/" + room).local.disconnectSockets();
    global.io._nsps.delete("/" + room);

    return res.json({
      status: "OK",
      room,
    });
  }
  res.sendStatus(400);
};

const updateUser = async (req, res) => {
  Room.updateUser({
    room: req.body.room,
    identity: req.body.identity,
    userName: req.body.userName,
  });
  res.json({
    status: "OK",
  });
};
const closeExpired = async (req, res) => {
  await Room.autoRoomExpiredClose();
  res.send("Check room expired complete");
};

export default {
  updateRoomType,
  updateRoomStatus,
  closeExpired,
  getRoomDetail,
  updateUser,
  closeRoom,
  deleteRoom,
  listRooms,
  verifyUser,
  verifyToken,
};
