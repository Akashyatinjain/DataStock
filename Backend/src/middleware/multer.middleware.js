import multer from "multer";

const uploadPath = "public/temp";

// ── Free-tier safe limits ──
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB – free tier

const ALLOWED_MIME_TYPES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",

  // Documents
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Video
  "video/mp4",

  // Archives
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

export const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // single file uploads only
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

export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS_LABEL };