import multer from "multer";

const uploadPath = "public/temp";

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",

  "application/pdf",

  "video/mp4",

  "application/zip",

  "text/plain",

  "application/msword",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {

    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueSuffix + "-" + file.originalname
    );
  }
});

export const upload = multer({

  storage,

  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },

  fileFilter: (req, file, cb) => {

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File type not allowed"));
    }

    cb(null, true);
  }
});