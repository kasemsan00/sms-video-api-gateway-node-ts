import AuthService from "../../Services/auth.service.js";
import UserService from "../../Services/user.service.js";
import LinkService from "../../Services/link.service.js";
import UsageLogService from "../../Services/usageLog.service.js";
import logger from "../../../logger.js";

const authMiddleware = async (socket, next) => {
  const namespace = socket.nsp.name.substring(1); // Remove leading '/'

  if (namespace === "queue" || namespace === "newqueue") {
    return next();
  }
  if (namespace === "mobile") {
    return next();
  }

  if (!socket.handshake.query.token) {
    logger.error("Authentication error %s", socket.handshake.query.token);
    return next(new Error("Authentication error"));
  }

  const decoded = await AuthService.verifyToken({ token: socket.handshake.query.token });
  if (decoded === "invalid signature") {
    return next(new Error("Authentication error"));
  }

  const { userName, userType, linkID, linkType, mobile, color } =
    decoded.metadata !== undefined
      ? JSON.parse(decoded.metadata)
      : {
          userName: socket.handshake.query.userName,
          userType: "user",
          color: "",
        };

  const userExist = await UserService.getUserDetail({ room: namespace, identity: decoded.sub });

  if (decoded.metadata !== undefined) {
    if (!userExist) {
      logger.info("Socket AddUser Room %s identity %s SocketID %s", namespace, decoded.sub, socket.id);
      await UserService.addUser({
        room: namespace,
        identity: decoded.sub,
        userName,
        userType,
        status: decoded.roomJoin !== true ? "connection" : "wait",
        color,
        socketId: socket.id,
      });
    } else {
      logger.info("Socket UpdateUser Room %s identity %s SocketID %s", namespace, decoded.sub, socket.id);
      UserService.updateUser({
        room: namespace,
        identity: decoded.sub,
        userName,
        color,
        socketId: socket.id,
      });
    }

    if (linkID !== undefined) {
      await LinkService.checkAndUpdateOneTimeLink({ linkID });
    }
  }

  UserService.updateUserStatus({
    room: namespace,
    identity: decoded.sub,
    status: "connection",
  });

  if (decoded.sub === undefined) {
    return next(new Error("Authentication error"));
  }

  if (!decoded.sub.startsWith("EG_")) {
    const _linkID = namespace.replace("data/", "");
    UsageLogService.addStatusLog({
      linkID: _linkID,
      linkType,
      mobile,
      room: namespace,
      identity: decoded.sub,
      userType,
      status: "Connection",
      data: decoded.metadata,
    });

    setTimeout(async () => {
      try {
        const result = await UsageLogService.getCRMLinkStatusLog({
          linkID: _linkID,
          room: namespace,
          linkType,
        });
        if (_linkID !== undefined && _linkID !== "undefined") {
          global.io.of("data/" + _linkID).emit("history", result);
        }
      } catch (err) {
        console.log(err);
      }
    }, 1000);
  }

  socket.decodedToken = decoded;
  next();
};

export default authMiddleware;
