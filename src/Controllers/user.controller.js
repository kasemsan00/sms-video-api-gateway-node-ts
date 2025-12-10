import UserService from "../Services/user.service.js";
import LinkService from "../Services/link.service.js";

const getUserDetail = async (req, res) => {
  const result = await UserService.getUserDetail({ room: req.query.room, identity: req.query.identity });
  if (result) {
    res.json({
      status: "OK",
      data: {
        userName: result.userName,
      },
    });
  } else {
    res.json({
      status: "FAIL",
      message: "invalid room or identity",
    });
  }
};
const generateUser = async (req, res) => {
  const resultUserDetail = await getUserDetail({ room: req.decoded.video.room, identity: req.decoded.sub });
  const result = await UserService.generateUser({
    room: req.body.room,
    userName: resultUserDetail.userName,
    userType: resultUserDetail.userType,
  });
  if (result.token) {
    res.json({
      status: "OK",
      message: "Create access token successful",
      identity: result.identity,
      token: result.token,
    });
  } else {
    res.json({
      status: "FAIL",
    });
  }
};
const generateUserJoin = async (req, res) => {
  let roomJoin = false;
  if (req.body.linkID !== undefined) {
    roomJoin = true;
  }
  // console.log(req.body);
  const result = await UserService.generateUser({
    linkID: req.body.linkID,
    room: req.body.room,
    identity: req.decoded.sub,
    userName: req.body.userName,
    userType: "user",
    isAddUser: false,
    roomJoin: roomJoin,
    userAgent: req.headers["user-agent"].toString(),
  });

  if (result.token) {
    res.json({
      status: "OK",
      message: "Create access token successful",
      data: {
        identity: result.identity,
        token: result.token,
      },
    });
  } else {
    res.json({
      status: "FAIL",
    });
  }
};
const generateChatUser = async (req, res) => {
  const result = await UserService.generateUser({
    room: req.body.room,
    userName: req.body.userName,
    userType: "user",
    roomJoin: false,
  });
  if (result.token) {
    res.json({
      status: "OK",
      message: "Create access token successful",
      identity: result.identity,
      token: result.token,
    });
  } else {
    res.json({
      status: "FAIL",
    });
  }
};
const getUserAlreadyConnected = async (req, res) => {
  const result = await UserService.getUserAlreadyConnected(req.query.room, req.query.identity);
  if (result.msg === "participant does not exist") {
    res.json({
      status: "FAIL",
      data: result,
    });
  } else {
    res.json({
      status: "OK",
      data: result,
    });
  }
};
const listParticipants = async (req, res) => {
  const result = await UserService.listParticipants(req.query.room);
  res.json(result);
};
const mutePublishedTrack = async (req, res) => {
  const result = await UserService.mutePublishedTrack({
    room: req.body.room,
    identity: req.body.identity,
    track_sid: req.body.track_sid,
    muted: req.body.muted,
  });

  res.json(result);
};
const updateParticipants = async (req, res) => {
  const result = await UserService.updateUserParticipant(req.body.room, req.body.identity, req.body.userName);
  res.json(result);
};
const removeParticipant = async (req, res) => {
  await UserService.removeParticipant({ room: "x", identity: "y" });
  res.json({
    status: "test",
  });
};

const getUserAgent = async (req, res) => {
  const { identity, linkConnectId } = req.query;
  if (identity === undefined && linkConnectId === undefined) {
    return res.status(400).send("invalid parameter");
  }
  let userAgent = null;
  if (identity !== "undefined") {
    userAgent = await UserService.getUserAgent({ identity });
    return res.json({
      userAgent,
    });
  }
  if (linkConnectId !== "undefined") {
    userAgent = await LinkService.getUserAgent({ id: linkConnectId });
    return res.json({
      userAgent,
    });
  }
  res.status(400).send("unable get userAgent");
};

export default {
  getUserAgent,
  generateUser,
  getUserDetail,
  removeParticipant,
  updateParticipants,
  mutePublishedTrack,
  listParticipants,
  generateUserJoin,
  generateChatUser,
  getUserAlreadyConnected,
};
