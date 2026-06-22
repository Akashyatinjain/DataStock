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
  moveToTrash,
  restoreFromTrash,
  getTrashFiles,
  emptyTrash,
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

// Trash routes — must be before /:id to avoid "trash" being parsed as an id
router.get("/trash", authenticateUser, getTrashFiles);
router.delete("/trash", authenticateUser, emptyTrash);
router.patch("/:id/trash", authenticateUser, moveToTrash);
router.patch("/:id/restore", authenticateUser, restoreFromTrash);

router.patch("/:id/star", authenticateUser, toggleStarFile);

router.delete("/:id",authenticateUser,deleteFile);


export default router;

