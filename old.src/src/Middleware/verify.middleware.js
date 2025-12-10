import logger from "../../logger.js";
import AuthService from "../Services/auth.service.js";
import LinkService from "../Services/link.service.js";

const middlewareVerifyToken = async (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.json({
      status: "FAIL",
      message: "Invalid token",
    });
    return null;
  }
  const decoded = await AuthService.verifyToken({ token: req.headers.authorization });
  if (decoded.toString() !== "JsonWebTokenError: jwt malformed" && decoded.toString() !== "invalid token") {
    req.decoded = decoded;
    return next();
  }
  res.json({
    status: "FAIL",
    data: decoded,
  });
};
const middlewareVerifyTokenJoinConference = async (req, res, next) => {
  if (req.body.linkID !== undefined) {
    const resultLinkIDDetail = await LinkService.getLinkDetail({ linkID: req.body.linkID });
    if (resultLinkIDDetail.length >= 1) {
      req.body.room = resultLinkIDDetail[0].room;
      return next();
    } else {
      res.json({
        status: "FAIL",
      });
    }
  } else {
    const decoded = await AuthService.verifyToken({ token: req.headers.authorization });
    logger.debug("%s", decoded.toString());
    if (decoded.toString() !== "JsonWebTokenError: jwt malformed" && decoded.toString() !== "invalid token") {
      req.decoded = decoded;
      return next();
    } else {
      req.decoded = undefined;
      return next();
    }
  }
};

export default { middlewareVerifyToken, middlewareVerifyTokenJoinConference };
