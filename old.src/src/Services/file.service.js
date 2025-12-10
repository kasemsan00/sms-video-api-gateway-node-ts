import sharp from "sharp";
import logger from "../../logger.js";
import sql from "./db.service.js";

const getFilePicture = async ({ room }) => {
  const stmt = `SELECT files.filename, CONCAT('${process.env.API_URL}', files.url) as url, files.width, files.height, files.createdAt
    FROM files
    LEFT JOIN link_connect ON files.linkId = link_connect.linkID 
    WHERE link_connect.room = '${room}'`;

  try {
    return await sql.query(stmt);
  } catch (error) {
    logger.error("Get picture list error %s", error);
    return false;
  }
};

const createThumbnails = async ({ input, output, fileData }) => {
  try {
    return await sharp(input + fileData.filename)
      .resize(200, 200)
      .withMetadata()
      .toFile(output + fileData.filename);
  } catch (error) {
    logger.error("Create thumbnail error %s", error);
    return false;
  }
};
const getWidthHeight = async ({ path }) => {
  const image = await sharp(path);
  const metadata = await image.metadata();
  return {
    width: metadata.width,
    height: metadata.height,
  };
};

const insertData = ({ linkID, elementId, filename, url, thumbnail, fileType, size, mimetype, width, height }) => {
  try {
    const stmt = `INSERT INTO files (linkID, elementId, filename, url, thumbnail, fileType, size, mimetype, width, height) VALUES ('${linkID}', ${elementId}, '${filename}', '${url}', '${thumbnail}', '${fileType}', ${size}, '${mimetype}', ${width}, ${height})`;
    sql.query(stmt);
  } catch (error) {
    logger.error("Insert data error %s", error);
  }
};

export default {
  getFilePicture,
  insertData,
  createThumbnails,
  getWidthHeight,
};
