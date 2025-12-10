import dayjs from "dayjs";
import ChatService from "../Services/chat.service.js";
import UserService from "../Services/user.service.js";
import AuthService from "../Services/auth.service.js";
import RoomService from "../Services/room.service.js";
import PositionService from "../Services/position.service.js";
import RecordService from "../Services/record.service.js";
import UsageLogService from "../Services/usageLog.service.js";
import logger from "../../logger.js";
import LinkService from "../Services/link.service.js";
import CarService from "../Services/car.service.js";

let ask_to_join_data = [];
const lastCarPosition = [];

const initialSocket = async ({ io, namespace }) => {
  logger.info("init namespace %s", JSON.stringify(namespace));

  if (namespace === undefined || namespace === "undefined" || namespace === null || namespace === "null") {
    return;
  }

  const connections = io.of("/" + namespace);
  const checkUserExist = () => {
    UserService.updateSocketIOUser({ room: namespace, sids: connections.adapter.sids });
  };

  connections.use(async (socket, next) => {
    if (namespace === "queue") {
      return next();
    }
    if (namespace === "newqueue") {
      return next();
    }
    if (namespace === "mobile") {
      return next();
    }

    if (socket.handshake.query.token) {
      const decoded = await AuthService.verifyToken({ token: socket.handshake.query.token });
      const { userName, userType, linkID, linkType, mobile } =
        decoded.metadata !== undefined ? JSON.parse(decoded.metadata) : { userName: socket.handshake.query.userName, userType: "user", color: "" };
      const userExist = await UserService.getUserDetail({ room: namespace, identity: decoded.sub });

      if (decoded !== "invalid signature") {
        if (decoded.metadata !== undefined) {
          const { linkID, color } = JSON.parse(decoded.metadata);
          if (userExist === false) {
            logger.info("Socket AddUser Room %s identity %s SocketID %s", namespace, decoded.sub, socket.id);
            await UserService.addUser({
              room: namespace,
              identity: decoded.sub,
              userName: userName,
              userType: userType,
              status: decoded.roomJoin !== true ? "connection" : "wait",
              color,
              socketId: socket.id,
            });
          } else {
            logger.info("Socket UpdateUser Room %s identity %s SocketID %s", namespace, decoded.sub, socket.id);
            UserService.updateUser({ room: namespace, identity: decoded.sub, userName: userName, color, socketId: socket.id });
          }
          if (linkID !== undefined) {
            await LinkService.checkAndUpdateOneTimeLink({ linkID });
          }
        }
        logger.debug("metadata %s", decoded.metadata);
        UserService.updateUserStatus({ room: namespace, identity: decoded.sub, status: "connection" });
        logger.info("Token decode %s", JSON.stringify(decoded));
        if (decoded.sub === undefined) {
          return next(new Error("Authentication error"));
        }

        if (!decoded.sub.startsWith("EG_")) {
          const _linkID = namespace.replace("data/", "");
          UsageLogService.addStatusLog({
            linkID: _linkID,
            linkType: linkType,
            mobile: mobile,
            room: namespace,
            identity: decoded.sub,
            userType: userType,
            status: "Connection",
            data: decoded.metadata,
          });
          setTimeout(async () => {
            UsageLogService.getCRMLinkStatusLog({
              linkID: _linkID,
              room: namespace,
              linkType: linkType,
            })
              .then((result) => {
                if (_linkID !== undefined && _linkID !== "undefined") {
                  global.io.of("data/" + _linkID).emit("history", result);
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }, 1000);
        }
        return next();
      }
    } else {
      logger.error("Authentication error %s", socket.handshake.query.token);
      return next(new Error("Authentication error"));
    }
  });

  connections.on("connection", async (socket) => {
    logger.debug("Socket ID %s Connected", socket.id);
    let userDetail = false;

    socket.emit("log", {
      message: "connection success",
    });
    if (namespace === "mobile") {
      const taskId = socket.handshake.query.id;
      console.log("mobile task", taskId);
      if (taskId === undefined || taskId === "") {
        socket.disconnect();
      }
      socket.emit("connection", {
        message: "connection success",
        case: taskId,
        status: "open || arrive || cancel || complete",
        dtmCreated: "2022-01-01 00:00:00",
        dtmUpdated: "2022-01-01 00:00:00",
        latitude: 13.734,
        longitude: 100.567,
        accuracy: 100,
      });
    }

    UserService.getUserDetailCallback({ room: namespace, identity: socket.handshake.query.identity }, async (result) => {
      userDetail = result;
      connections.emit("user-connection", {
        camera: result.camera,
        microphone: result.microphone,
        identity: result.identity,
        userName: result.userName,
        userType: result.userType,
        conference: result.conference,
      });

      if (result.userType === "user") {
        const pos = await CarService.getCarPosition({ room: namespace });
        if (pos !== false) {
          connections.emit("car-position", pos);
        }
      }
    });

    checkUserExist();
    RoomService.getRoomDetailCallback(namespace, ({ status, recordId, dtmStartRecord, dtmStopRecord, recordDuration }) => {
      socket.emit("connection-success", {
        status,
        room: namespace,
        recordId,
        dtmStartRecord,
        dtmStopRecord,
        recordDuration,
      });
    }).then((r) => r);

    const userJoinHandler = (data, socketID, typehandle) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].socketID === socketID) {
          if (typehandle === "disconnected") {
            data.splice(i, 1);
            i--;
          }
          if (typehandle === "deny") {
            data.splice(i, 1);
            i--;
          }
          if (typehandle === "admit") {
            data.splice(i, 1);
            i--;
          }
        }
      }
      ask_to_join_data = data;
    };
    const sendPermissionToAdmin = async (room) => {
      const socket_admin_list = await UserService.getUserRoomAdmin(room);
      logger.info("Send Permission to Admin room %s", room);
      socket_admin_list.forEach((element) => {
        socket.broadcast.to(element.socketId).emit("auth-join-conference", ask_to_join_data);
      });
    };

    socket.on("user-position", async (data) => {
      await LinkService.updateLinkIDLatLng({
        linkID: data.linkID,
        accuracy: data.accuracy,
        latitude: data.latitude,
        longitude: data.longitude,
      });
      const lagLngGroup = await LinkService.getLatLngGroup({
        room: namespace,
        userType: "user",
      });
      UsageLogService.addStatusLog({
        linkID: data.linkID,
        room: namespace,
        identity: userDetail.identity,
        userType: userDetail.userType,
        status: "UpdateLatLngLinkDetail",
        latitude: data.latitude,
        longitude: data.longitude,
      });
      UsageLogService.addDataLog({ data });
      connections.emit("user-position-group", lagLngGroup);
    });
    socket.on("get-user-position-group", async () => {
      const lagLngGroup = await LinkService.getLatLngGroup({
        room: namespace,
        userType: "user",
      });
      connections.emit("user-position-group", lagLngGroup);
    });

    socket.on("carTracking", async (data) => {
      if (data.status === "initial") {
        connections.emit("agentCar", lastCarPosition[namespace]);
      } else {
        lastCarPosition[namespace] = data;
        connections.emit("agentCar", lastCarPosition[namespace]);
      }

      if (data.status === "getDestination") {
        const resp = await CarService.getUserLatLng({ room: namespace });
        if (resp !== false) {
          connections.emit("destination", resp);
        }
      }

      CarService.updateCarPosition({
        userName: data.userName,
        room: namespace,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        altitude: data.altitude,
        altitudeAccuracy: data.altitudeAccuracy,
      });
    });

    socket.on("position", async (data) => {
      if (data.linkID !== undefined) {
        logger.info("Emit to data/%s %s", data.linkID, JSON.stringify(data));
        io.of("data/" + data.linkID).emit("position", data);
      }
      PositionService.updatePosition({
        socketId: socket.id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
      }).then((r) => r);
      LinkService.updateLatLngLinkDetail({
        linkID: data.linkID,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
      }).then((r) => r);
      UsageLogService.addDataLog({ data });
    });

    socket.on("room-record", async () => {
      const currentRecordId = await RecordService.getRecordID({ room: namespace });
      let response = null;
      if (currentRecordId === "") {
        const egressStatus = await RecordService.checkEgressAvailable();
        if (egressStatus) {
          response = await RecordService.startRecord({ room: namespace });
          await RecordService.updateRecordID({ room: namespace, recordId: response.data.egressId, status: "startRecord" });
          logger.info("Start Record Room %s EgressId %s", namespace, response.data.egressId);
        } else {
          response = {
            status: "egressNotAvailable",
            message: "Record service not available",
          };
          logger.info("Record service not available");
        }
      } else if (currentRecordId !== "") {
        response = await RecordService.stopRecord({ room: namespace, recordId: currentRecordId });
        await RecordService.updateRecordID({ room: namespace, recordId: "", status: "stopRecord" });
        logger.info("Stop Record Room %s EgressId %s", namespace, currentRecordId);
      }
      connections.emit("room-record", response);
    });
    socket.on("user-conference", async (data) => {
      await UserService.updateUserConference({ identity: data.identity, conference: data.conference });
      connections.emit("user-conference", data);
    });
    socket.on("camera-microphone-status", (data) => {
      // UserService.updateUserCameraMicrophoneStatus({ room: data.room, identity: data.identity, status: data.status });
      // connections.emit("camera-microphone-status", data);
    });
    socket.on("joinChat", (roomName) => {
      socket.join(roomName);
    });

    socket.on("chat-message", async (data) => {
      const { status, messageUnread } = await RoomService.getRoomDetail(namespace);
      data.dtmcreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
      // console.log("chat message", JSON.stringify(data));

      if (status === "close") {
        logger.error("Chat Message %s close", namespace);
        data.status = "close";
        console.log(data);
        connections.emit("chat-message", data);
      }
      const result = await ChatService.saveChatMessage({
        status: "open",
        room: namespace,
        identity: data.identity,
        chat_identity: data.chat_identity,
        userName: data.userName,
        userType: data.userType,
        text: data.text,
        files: data.files,
        color: data.color,
        replyToMessageId: data.replyToMessageId,
        replyToUserName: data.replyToUserName,
        replyToText: data.replyToText,
      });
      data.messageId = result.insertId;
      connections.emit("chat-message", data);
      if (data.userType === "user") {
        const resultAgentList = await UserService.agentList({ room: namespace });
        if (resultAgentList > 0) return;
        if (messageUnread === 1) return;
        RoomService.updateMessageUnread({ room: namespace, messageUnread: 1 });
        io.of("newqueue").emit("case-data", {
          action: "messageUnread",
          room: namespace,
          messageUnread: 1,
        });
      }
    });

    socket.on("disconnect", async () => {
      logger.debug("Socket ID %s Disconnected", socket.id);
      userJoinHandler(ask_to_join_data, socket.id, "disconnected");
      connections.emit("user-disconnect", {
        status: "disconnect",
        identity: userDetail.identity,
        userName: userDetail.userName,
      });
      UserService.updateUserStatus({ room: userDetail.room, identity: userDetail.identity, status: "disconnect" });
      UserService.removeParticipant({ room: userDetail.room, identity: userDetail.identity });

      const linkIdList = await LinkService.getLinkIdList({ room: userDetail.room, mobile: userDetail.userName });
      // console.log("linkIdList", linkIdList);

      if (linkIdList !== null && linkIdList !== undefined) {
        for (const linkDetail of linkIdList) {
          if (linkDetail !== null) {
            UsageLogService.addStatusLog({
              linkID: linkDetail.linkID,
              linkType: linkDetail.linkType,
              mobile: linkDetail.mobile,
              room: userDetail.room,
              identity: userDetail.identity,
              userType: userDetail.userType,
              status: "Disconnect",
              data: userDetail.metadata,
            });
            setTimeout(async () => {
              try {
                const result = await UsageLogService.getCRMLinkStatusLog({
                  linkID: linkDetail.linkID,
                  room: namespace,
                  linkType: "video",
                });
                if (linkDetail.linkID !== undefined && linkDetail.linkID !== "undefined" && result) {
                  global.io.of("data/" + linkDetail.linkID).emit("history", result);
                }
              } catch (err) {
                console.error(err);
              }
            }, 1000);
          }
        }
      }
    });

    socket.on("get-chat-history", async (data) => {
      const chatHistory = await ChatService.chatHistory({ room: data.room });
      connections.emit("chat-history", chatHistory);
    });

    socket.on("auth-join-conference", async (data) => {
      logger.warn("Auth join conference %s", data);
      ask_to_join_data.push({
        room: data.room,
        userName: data.userName,
        socketID: socket.id,
        authJoin: "waiting",
      });
      await sendPermissionToAdmin(data.room);
      const sendRepeat = () => {
        if (ask_to_join_data.length !== 0) {
          setTimeout(() => {
            sendPermissionToAdmin(data.room);
            sendRepeat();
          }, process.env.JOIN_ROOM_REPEAT_DELAY);
        }
      };
      sendRepeat();
    });

    socket.on("auth-join-conference-answer", async (data) => {
      let token = null;
      let identity = null;
      if (data.authJoin === "admit") {
        let resultUserGenerate = await UserService.generateUserJoinConference({
          room: data.room,
          userName: data.userName,
          socketId: data.socketID,
        });
        token = resultUserGenerate.token;
        identity = resultUserGenerate.identity;
        userJoinHandler(ask_to_join_data, data.socketID, "admit");
      }
      if (data.authJoin === "deny") {
        userJoinHandler(ask_to_join_data, data.socketID, "deny");
      }
      connections.to(data.socketID).emit("auth-join-conference-answer", {
        authJoin: data.authJoin,
        identity: identity,
        userName: data.userName,
        token: token,
      });
    });
    socket.on("get-user-detail", async (data) => {
      await RoomService.updateTimeRoom(namespace);
      if (userDetail) {
        connections.to(socket.id).emit("user-detail", {
          identity: data.identity,
          userName: userDetail.userName,
          userType: userDetail.userType,
        });
      }
    });
    socket.on("get-user-list", async () => {
      const userList = await UserService.listParticipants(namespace);
      connections.to(socket.id).emit("user-list", {
        userList: userList,
      });
    });
    socket.on("update-username", async (data) => {
      logger.info("Change username Room %s identity %s userName %s", data.room, data.identity, data.userName);
      connections.emit("update-username", data);
      connections.emit("user-list", {
        status: "updateUserName",
        userList: data,
      });
      UserService.updateUser({
        linkID: data.linkID,
        room: data.room,
        identity: data.identity,
        userName: data.userName,
      });
      UsageLogService.addDataLog({ data });
      await UserService.updateUserParticipant(data.room, data.identity, data.userName);
    });
    socket.on("update-admin-user", async (data) => {
      logger.info("Assign Admin identity", data.userIdentity);
      const adminDetail = await User.getUserDetail({ room: namespace, identity: data.adminIdentity });
      if (adminDetail.userType === "admin") {
        await UserService.updateUserType({
          room: namespace,
          identity: data.userIdentity,
          userType: "admin",
        });
      }
      UsageLogService.addDataLog({ data });
      connections.emit("update-admin-user", {
        identity: data.userIdentity,
      });
    });

    socket.on("update-microphone-status", async (data) => {
      logger.debug("Update microphone status %s", JSON.stringify(data));
      try {
        await UserService.updateUserMicrophone({ identity: data.identity, microphone: data.microphone });
        UsageLogService.addDataLog({ data });
        // User.mutePublishedTrack({ room: namespace, identity: data.identity, track_sid: data.track_sid, muted: !data.microphone });
      } catch (error) {
        logger.error(error);
      }
      connections.emit("update-microphone-status", data);
    });

    socket.on("case-data", (data) => {
      connections.emit("case-data", data);
    });

    socket.on("update-camera-status", async (data) => {
      logger.debug("Update camera status %s", JSON.stringify(data));
      try {
        await UserService.updateUserCamera({ identity: data.identity, camera: data.camera });
        UsageLogService.addDataLog({ data });
        // User.mutePublishedTrack({ room: namespace, identity: data.identity, track_sid: data.track_sid, muted: !data.camera });
      } catch (error) {
        logger.error(error);
      }
    });
    socket.on("track-muted-unmuted", async (data) => {
      logger.info("Track Muted Unmuted %s", JSON.stringify(data));
      await UserService.mutePublishedTrack({
        room: namespace,
        identity: data.identity,
        track_sid: data.trackSid,
        muted: data.isMuted,
      });
      UsageLogService.addDataLog({ data });
      connections.emit("track-muted-unmuted", data);
    });
    socket.on("agent-close-room", async (data) => {
      UsageLogService.addDataLog({ data });
      connections.emit("agent-close-room", data);
    });
    socket.on("force-leave-conference", async (data) => {
      const getSocketId = await UserService.getSocketIdFromIdentity(data.identity);
      logger.info("Command User to leave %s", getSocketId);
      UsageLogService.addDataLog({ data });
      connections.to(getSocketId).emit("force-leave-conference", { userType: "admin", command: "leaveConference" });
    });
    socket.on("force-stop-sharescreen", async (data) => {
      const getSocketId = await UserService.getSocketIdFromIdentity(data.identity.replace("_screen", ""));
      logger.info("Command User %s to stop share_screen ", getSocketId);
      UsageLogService.addDataLog({ data });
      connections.to(getSocketId).emit("force-stop-sharescreen", {
        userType: "admin",
        command: "stopShareScreen",
      });
    });
    // socket.on("d")
    socket.on("case-list-data", async (data) => {
      // connections.to(socket.id).emit("case-list-data", await CaseService.getCaseHistory({ page: data.page, limit: data.maxRow }));
      // connections
      //   .to(socket.id)
      //   .emit("case-list-count", await CaseService.getCaseHistory({ output: "count", page: data.page, limit: data.maxRow }));
    });
    socket.on("case-list-page", async (data) => {
      // connections.to(socket.id).emit("case-list-page", await CaseService.getCaseHistory({ page: data.page, limit: data.maxRow }));
    });
    socket.on("queue", async (data) => {
      const historyPage = async ({
        service = 1,
        text = undefined,
        type = undefined,
        page,
        maxRow,
        mobile,
        agentName,
        linkType,
        status,
        dateTimeStart,
        dateTimeEnd,
      }) => {
        const historyList = await LinkService.getSMSLinkHistory({
          service,
          text,
          type,
          page,
          limit: maxRow,
          mobile,
          agentName,
          linkType,
          status,
          dateTimeStart,
          dateTimeEnd,
        });
        const historyCount = await LinkService.getSMSLinkHistory({
          service,
          output: "count",
          text,
          type,
          mobile,
          agentName,
          linkType,
          status,
          dateTimeStart,
          dateTimeEnd,
        });
        return {
          status: "data",
          service: service,
          page: data.page,
          maxRow: maxRow,
          count: historyCount,
          data: historyList,
        };
      };
      if (data.status === "init") {
        connections.to(socket.id).emit("queue", await historyPage({ service: data.service, page: data.page, maxRow: data.maxRow }));
      }
      if (data.status === "changePage") {
        connections.to(socket.id).emit("queue", await historyPage({ service: data.service, page: data.page, maxRow: data.maxRow }));
      }
      if (data.status === "searchAll") {
        connections.to(socket.id).emit(
          "queue",
          await historyPage({
            service: data.service,
            text: data.value,
            type: "searchAll",
            page: data.page,
            maxRow: data.maxRow,
          }),
        );
      }
      if (data.status === "searchAdvanced") {
        connections.to(socket.id).emit(
          "queue",
          await historyPage({
            service: data.service,
            text: data.value,
            type: "searchAdvanced",
            page: data.page,
            maxRow: data.maxRow,
            mobile: data.mobile,
            agentName: data.agentName,
            linkType: "",
            status: data.roomStatus,
            dateTimeStart: data.dateTimeStart,
            dateTimeEnd: data.dateTimeEnd,
          }),
        );
      }
    });
  });
};

const initRoomSocket = async () => {
  const roomLists = await RoomService.getRoomConferenceList({ status: "open" });
  if (roomLists !== false) {
    roomLists.forEach((item) => {
      if (item.room === null) return;

      // Check if namespace already exists to prevent memory leak
      const namespacePath = `/${item.room}`;
      if (global.io._nsps.has(namespacePath)) {
        return; // Skip if namespace already exists
      }

      initialSocket({
        io: global.io,
        namespace: item.room,
      });
    });
  }
};

const initQueueSocket = async () => {
  console.log("init ws queue");
  await initialSocket({
    io: global.io,
    namespace: "queue",
  });
};

const initNewQueueSocket = async () => {
  logger.info("Init Socket newqueue");
  await initialSocket({
    io: global.io,
    namespace: "newqueue",
  });
};

const initMobileDataSocket = async () => {
  await initialSocket({
    io: global.io,
    namespace: "mobile",
  });
};

export default {
  initRoomSocket,
  initialSocket,
  initQueueSocket,
  initNewQueueSocket,
  initMobileDataSocket,
};
