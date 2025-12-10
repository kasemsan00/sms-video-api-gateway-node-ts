import { RoomServiceClient } from "livekit-server-sdk";

const svc = new RoomServiceClient(process.env.LIVEKIT_HOST, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

const testUnMuteAll = async (req, res) => {
  const { room } = req.query;
  const list = await svc.listParticipants(room);
  console.log(list);
  res.send("OK");
};
const getAllNamespaces = async (req, res) => {
  const namespaces = Array.from(global.io._nsps.keys());
  res.json(namespaces);
};
export default {
  testUnMuteAll,
  getAllNamespaces,
};
