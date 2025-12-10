import LinkService from "../Services/link.service.js";
import UserService from "../Services/user.service.js";
import AuthService from "../Services/auth.service.js";

const createToken = async (req, res) => {
  const token = await AuthService.createToken({ name: "Example", days: 9999 });
  res.json({
    status: "OK",
    token,
  });
};

const verifyJoinUserWithPassword = async (req, res) => {
  const resultVerify = await AuthService.verifyJoinUser({
    linkID: req.body.linkID,
    password: req.body.password,
  });
  if (resultVerify) {
    const linkDetail = await LinkService.getLinkDetail({ linkID: req.body.linkID });
    let roomJoin = linkDetail.requireJoinPermission !== 1;

    const resultGenerateUser = await UserService.generateUser({
      linkID: req.body.linkID,
      room: linkDetail.room,
      userName: req.body.userName,
      userType: linkDetail.isAdmin === "1" ? "admin" : "user",
      roomJoin,
      isAddUser: false,
      userAgent: req.headers["user-agent"],
    });
    res.json({
      status: "OK",
      data: resultGenerateUser,
    });
  } else {
    res.json({
      status: "FAIL",
      message: "invalid id or password",
    });
  }
};
export default {
  createToken,
  verifyJoinUserWithPassword,
};
