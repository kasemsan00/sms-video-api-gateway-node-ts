import sql from "./db.service.js";

async function updatePosition({ socketId, latitude, longitude, accuracy }) {
  let stmt = `UPDATE room_user 
        SET latitude = '${latitude}', longitude = '${longitude}', accuracy = '${accuracy}' 
        WHERE socketId = '${socketId}' `;
  await sql.query(stmt);
}
async function getPosition({ linkId }) {
  const stmt = `SELECT latitude, longitude FROM link_connect WHERE linkID = '${linkId}' `;
  const result = await sql.query(stmt);
  if (result.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
    };
  }
  if (result.length > 0) {
    return result[0];
  }
}
export default {
  updatePosition,
  getPosition,
};
