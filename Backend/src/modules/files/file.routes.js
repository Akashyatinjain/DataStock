// import express from "express";

// import { uploadFile,getUserFiles } from "./file.controller.js";

// import {authenticateUser} from "../../middleware/authMiddleware"

// import { upload } from "../../middleware/multer.middleware.js";

// const router = express.router();

// router.post(
//   "/upload",

//   authenticateUser,

//   upload.single("file"),

//   uploadFile
// );

// router.get("/",authenticateUser,getUserFiles);

// export default router;


import express from "express";

import {
  uploadFile,
  getUserFiles,
  deleteFile,
  toggleStarFile,
} from "./file.controller.js";

import {
  authenticateUser
} from "../../middleware/authMiddleware.js";

import {
  upload
} from "../../middleware/multer.middleware.js";

const router = express.Router();



router.post("/upload",authenticateUser,upload.single("file"),uploadFile);

router.get("/",authenticateUser,getUserFiles);

router.patch("/:id/star", authenticateUser, toggleStarFile);

router.delete("/:id",authenticateUser,deleteFile);


export default router;

