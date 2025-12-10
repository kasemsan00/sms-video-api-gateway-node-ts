import Record from "../Services/record.service.js";
import logger from "../../logger.js";
import RoomService from "../Services/room.service.js";
import FileService from "../Services/file.service.js";
import VideoService from "../Services/video.service.js";
import dayjs from "dayjs";
import Request from "../Request/request.js";

const API_URL = process.env.API_URL;

const fileHistoryRecord = async (req, res) => {
  const { room } = req.query;

  if (!room) {
    return res.status(400).json({
      status: "FAIL",
      message: "Room parameter is required",
    });
  }

  const serviceId = await RoomService.getServiceId({ room });
  if (!serviceId) {
    return res.status(404).json({
      status: "FAIL",
      message: "Room not found",
    });
  }

  const result = await Record.getFileHistory({ room });
  if (!result) {
    return res.status(404).json({
      status: "FAIL",
      message: "No file history found",
    });
  }

  // Add full URL to each file record
  result.forEach((item) => {
    item.url = `${API_URL}/record/${serviceId}/${item.filename}`;
  });

  res.json({
    status: "OK",
    data: result,
  });
};

const filePicture = async (req, res) => {
  const { room } = req.query;

  if (!room) {
    return res.status(400).json({
      status: "FAIL",
      message: "Room parameter is required",
    });
  }

  const result = await FileService.getFilePicture({ room });
  if (!result) {
    return res.status(404).json({
      status: "FAIL",
      message: "No pictures found for this room",
    });
  }

  res.json({
    status: "OK",
    data: result,
  });
};

const uploadFile = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    logger.error("Upload FILE_MISSING");
    return res.status(400).json({
      status: "FAIL",
      message: "No files provided",
    });
  }

  const linkID = req.query.linkID || "";
  const outputFiles = [];

  await Promise.all(
    req.files.map(async (element) => {
      logger.info("Processing file: %s %s", element.mimetype, element.filename);

      let thumbnail = null;
      let resolution = { width: null, height: null };
      let path = `/files/${element.folder}/`;

      // Handle image-specific processing
      if (element.fileType === "image") {
        thumbnail = `${API_URL}/thumbnails/${element.filename}`;
        path = `/images/${element.folder}/`;

        await FileService.createThumbnails({
          input: `./uploads/images/${element.folder}/`,
          output: "./uploads/thumbnails/",
          fileData: element,
        });

        resolution = await FileService.getWidthHeight({
          path: `./uploads/images/${element.folder}/${element.filename}`,
        });
      }

      // Build file response object
      const fileData = {
        id: element.id,
        filename: element.filename,
        url: `${API_URL}${path}${element.filename}`,
        thumbnail,
        fileType: element.fileType,
        size: element.size,
        mimetype: element.mimetype,
        resolution,
      };

      outputFiles.push(fileData);

      // Save file data to database
      await FileService.insertData({
        linkID,
        elementId: element.id,
        filename: element.filename,
        url: `${path}${element.filename}`,
        thumbnail: `/thumbnails/${element.filename}`,
        fileType: element.fileType,
        size: element.size,
        mimetype: element.mimetype,
        width: resolution.width,
        height: resolution.height,
      });
    }),
  );

  res.json({
    status: "OK",
    data: outputFiles,
  });
};

const uploadVideo = async (req, res) => {
  if (!req.file) {
    logger.error("Upload FILE_MISSING");
    return res.status(400).json({
      status: "FAIL",
      message: "No video file provided",
    });
  }

  const fileSize = req.file.size;
  const duration = req.file.duration;
  const room = `webrtc-record-${Date.now()}`;

  const resultInsert = await VideoService.insertRecordMedia({
    egressId: req.body.agentUsername || "-",
    room,
    filename: req.file.filename || "",
    encode: 0,
    recordType: req.body.recordType || "",
    fileSize,
    duration,
    filePath: req.file.destination.replace("./uploads", ""),
    uploader: req.body.uploader || "-",
  });

  // Enhance file object with additional properties
  req.file.url = `${API_URL}${req.file.destination.replace("./uploads", "")}/${req.file.filename}`;
  req.file.dtmCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
  req.file.uploader = req.body.uploader || "-";
  req.file.room = room;

  // Trigger encoding process
  Request.encodeStream({ recordId: resultInsert.insertId });

  res.json({
    status: "OK",
    file: req.file,
    insert: resultInsert,
  });
};

const videoList = async (req, res) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const recordType = req.query.recordType || "";

  // Get video list with pagination
  const videos = await VideoService.getVideoList({
    recordType,
    page,
    limit,
  });

  // Get total count for pagination metadata
  const totalCount = await VideoService.getVideoList({
    recordType,
    output: "count",
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    status: "OK",
    data: videos,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "FAIL",
      message: "Video ID is required",
    });
  }

  const result = await VideoService.deleteVideo({ id });

  if (!result || result.affectedRows === 0) {
    return res.status(404).json({
      status: "FAIL",
      message: "Video not found",
    });
  }

  res.json({
    status: "OK",
    message: "Video deleted successfully",
  });
};

export default {
  filePicture,
  fileHistoryRecord,
  uploadFile,
  uploadVideo,
  videoList,
  deleteVideo,
};
