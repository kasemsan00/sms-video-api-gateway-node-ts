import sql from "./db.service.js";
import dayjs from "dayjs";
import SqlString from "sqlstring";
import logger from "../../logger.js";

const saveChatMessage = async ({
  room,
  identity,
  chat_identity,
  userName,
  userType,
  text,
  files,
  replyToMessageId,
  replyToUserName = null,
  replyToText = null,
  color,
}) => {
  if (replyToMessageId === null || replyToMessageId === undefined) {
    replyToMessageId = 0;
  }

  userName = SqlString.escape(userName);
  text = SqlString.escape(text);

  files === undefined ? (files = "") : (files = JSON.stringify(files));
  files = SqlString.escape(files);
  try {
    return await sql.query(`
			INSERT INTO chat_message ( 
				room,  identity, chat_identity,  userName, userType,  text, color, files, replyToMessageId, replyToUserName, replyToText, dtmCreated
			) VALUES (
				'${room}', 
				'${identity}', 
			  '${chat_identity}',        
				 ${userName}, 
				'${userType}',
     		 ${text}, 
         '${color}',
				 ${files},
				'${replyToMessageId}',
				'${replyToUserName}',
				'${replyToText}',
				'${dayjs().format("YYYY-MM-DD HH:mm:ss")}' 
			)`);
  } catch (error) {
    if (error) {
      console.log(error);
      logger.error(error);
    }
  }
};
const chatHistory = async ({ room }) => {
  const stmt = `
		SELECT id, room, identity, chat_identity, userName, userType, text, color, files, replyToMessageId, replyToUserName, replyToText , dtmCreated 
		FROM chat_message 
		WHERE room = '${room}' ORDER BY dtmCreated ASC`;
  const result = await sql.query(stmt);
  try {
    result.forEach((element) => {
      if (element.files !== "" && element.files !== undefined) {
        element.files = JSON.parse(element.files);
      }
    });
  } catch (error) {
    logger.log(error);
  }

  if (result.length > 0) {
    return result;
  } else {
    return false;
  }
};

export default {
  saveChatMessage,
  chatHistory,
};
