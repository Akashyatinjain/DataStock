import fs from "fs/promises";
import multer from "multer";

const uploadPath = "public/temp";

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = VIDEO_MAX_FILE_SIZE;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "application/zip",
];

const ALLOWED_EXTENSIONS_LABEL =
  "PNG, JPG, PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, PPTX, MP4, ZIP";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(1))} ${units[index]}`;
};

const getMaxFileSizeForMimeType = (mimeType = "") => {
  if (mimeType.startsWith("video/")) return VIDEO_MAX_FILE_SIZE;
  if (mimeType.startsWith("image/")) return IMAGE_MAX_FILE_SIZE;
  return DEFAULT_MAX_FILE_SIZE;
};

const getFileTypeLabel = (mimeType = "") => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "file";
};

export const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error(
        `File type "${file.mimetype}" is not allowed. Accepted formats: ${ALLOWED_EXTENSIONS_LABEL}`
      );
      err.code = "INVALID_FILE_TYPE";
      return cb(err, false);
    }

    cb(null, true);
  },
});

export const validateUploadedFileSize = async (req, res, next) => {
  if (!req.file) return next();

  const maxSize = getMaxFileSizeForMimeType(req.file.mimetype);
  if (req.file.size <= maxSize) return next();

  if (req.file.path) {
    await fs.unlink(req.file.path).catch(() => {});
  }

  const fileType = getFileTypeLabel(req.file.mimetype);
  const err = new Error(
    `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} is too large. Maximum allowed size is ${formatBytes(maxSize)}.`
  );
  err.statusCode = 413;
  err.code = "FILE_TOO_LARGE";
  err.suggestion =
    fileType === "video"
      ? "Compress your video or upload a file under 100 MB."
      : "Compress your file or split it into smaller parts before uploading.";

  return next(err);
};

export {
  MAX_FILE_SIZE,
  DEFAULT_MAX_FILE_SIZE,
  IMAGE_MAX_FILE_SIZE,
  VIDEO_MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS_LABEL,
};
