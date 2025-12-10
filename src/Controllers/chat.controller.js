import ChatService from "../Services/chat.service.js";
import RoomService from "../Services/room.service.js";

const ChatHistory = async (req, res) => {
  const { room } = req.query;
  if (room === undefined) {
    return res.status(404).send("Invalid room");
  }
  const result = await ChatService.chatHistory({ room: req.query.room });
  if (result !== false) {
    return res.json(result);
  }
  return res.json([]);
};

const Notification = async (req, res) => {
  const { service } = req.query;
  if (service === undefined || service === "") {
    res.json({
      number: 0,
      caseList: [],
    });
    return;
  }
  const resultCount = await RoomService.getCountUnreadMessage({ service });
  const resultCaseList = await RoomService.getCaseUnreadList({ service });
  res.json({
    number: resultCount,
    caseList: resultCaseList,
  });
};

export default { ChatHistory, Notification };
