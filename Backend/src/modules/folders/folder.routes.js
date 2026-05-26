import express from "express";

import {
  createFolder,
  getFolders,
  deleteFolder
} from "./folder.controller.js";

import {
  authenticateUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();



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

router.get(
  "/",
  authenticateUser,
  getFolders
);

export default router;