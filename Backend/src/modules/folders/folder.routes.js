import express from "express";

import {
  createFolder,
  getFolders,
  deleteFolder,
  downloadFolder,
  renameFolder,
} from "./folder.controller.js";

import {
  authenticateUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/:id/download",
  authenticateUser,
  downloadFolder
);



router.post(
  "/",
  authenticateUser,
  createFolder
);

router.delete(
  "/:id",

  authenticateUser,

  deleteFolder
);

router.patch(
  "/:id/rename",
  authenticateUser,
  renameFolder
);

router.get(
  "/",
  authenticateUser,
  getFolders
);

export default router;