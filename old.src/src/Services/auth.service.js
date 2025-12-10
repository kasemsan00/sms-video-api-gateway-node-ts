import jwt from "jsonwebtoken";
import crypto from "crypto";
import sql from "./db.service.js";
import { AccessToken } from "livekit-server-sdk";
import logger from "../../logger.js";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$", 10);

const createToken = async ({ name, days }) => {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: nanoid(),
    name: name,
    ttl: days + " days",
  });
  at.addGrant({
    roomJoin: false,
  });
  return await at.toJwt();
};
const verifyToken = async ({ token }) => {
  try {
    token = token.replace("Bearer ", "");
    return await jwt.verify(token, process.env.LIVEKIT_API_SECRET);
  } catch (error) {
    logger.error(error);
    return error;
  }
};
const verifyJoinUser = async ({ linkID, password }) => {
  password = crypto.createHash("md5").update(password).digest("hex");
  let stmt = `SELECT linkID, requirePassword, password FROM link_connect WHERE linkID = '${linkID}' `;
  const result = await sql.query(stmt);
  try {
    if (result[0].requirePassword === 0) {
      return true;
    } else return result[0].password === password;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

// module.exports = { createToken, verifyToken, verifyJoinUser };
export default {
  createToken,
  verifyToken,
  verifyJoinUser,
};
