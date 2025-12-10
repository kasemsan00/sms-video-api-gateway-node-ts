import multer from "multer";
import fs from "fs";
import logger from "../../logger.js";
import { getVideoDurationInSeconds } from "get-video-duration";

const imageType = ["image/apng", "image/avif", "image/gif", "image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const videoType = [
  "video/x-flv",
  "video/mp4",
  "application/x-mpegURL",
  "video/MP2T",
  "video/3gpp",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/webm",
  "video/x-m4v",
];
const pdfType = ["application/pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.url === "/upload/video") {
      return cb(null, "./video-record");
    }
    let isImage = imageType.indexOf(file.mimetype) > -1;
    if (imageType.indexOf(file.mimetype) > -1) {
      file.fileType = "image";
    } else if (videoType.indexOf(file.mimetype) > -1) {
      file.fileType = "video";
    } else if (pdfType.indexOf(file.mimetype) > -1) {
      file.fileType = "pdf";
    } else {
      file.fileType = "file";
    }

    const folder = Date.now();
    file.folder = folder;

    if (isImage) {
      fs.mkdirSync("./uploads/images/" + folder);
      return cb(null, "./uploads/images/" + folder);
    } else {
      fs.mkdirSync("./uploads/files/" + folder);
      return cb(null, "./uploads/files/" + folder);
    }
  },
  filename: (req, file, cb) => {
    file.id = Date.now();
    file.filename = Buffer.from(file.originalname, "latin1").toString("utf-8");
    if (file.filename.endsWith(".json")) {
      file.filename = file.filename.replace(".json", ".txt");
    }
    return cb(null, file.filename);
  },
});

const uploadFile = multer({
  storage: storage,
  preservePath: true,
  limits: { fileSize: parseInt(process.env.FILE_SIZE_LIMIT) },
});
const uploadRecord = multer({
  storage: storage,
});

// Middleware to get video duration after upload
const getVideoDuration = async (req, res, next) => {
  if (!req.file || !req.file.path) {
    return next();
  }

  try {
    // Check if the file is a video
    const isVideo = videoType.some((type) => req.file.mimetype === type);

    if (isVideo) {
      // Get the duration of the video
      const durationInSeconds = await getVideoDurationInSeconds(req.file.path);

      // Add the duration to the file object
      req.file.duration = durationInSeconds;

      logger.info(`Video duration: ${durationInSeconds} seconds`);
    }
    return next();
  } catch (error) {
    logger.error(`Error getting video duration: ${error.message}`);
    req.file.duration = 0; // Set default duration if there's an error
    return next();
  }
};

const fileSizeLimitErrorHandler = (err, req, res, next) => {
  if (err) {
    logger.error("FileSizeLimit ErrorHandler %s", err);
    console.log("req", req);

    res.json({
      status: "FAIL",
      data: err,
    });
  } else {
    return next();
  }
};

export default { fileSizeLimitErrorHandler, uploadFile, uploadRecord, getVideoDuration };
