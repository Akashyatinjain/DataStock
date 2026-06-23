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
  upload,
  validateUploadedFileSize,
} from "../../middleware/multer.middleware.js";

const router = express.Router();

// ── Multer error-catching wrapper ──
// Wraps upload.single() so that Multer errors (file too large, wrong type, etc.)
// are forwarded to the global error handler instead of crashing the request.
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return next(err); // forwards to errorHandler
    }
    next();
  });
};

router.post("/upload", authenticateUser, handleUpload, validateUploadedFileSize, uploadFile);

router.get("/", authenticateUser, getUserFiles);

// Trash routes — must be before /:id to avoid "trash" being parsed as an id
router.get("/trash", authenticateUser, getTrashFiles);
router.delete("/trash", authenticateUser, emptyTrash);
router.patch("/:id/trash", authenticateUser, moveToTrash);
router.patch("/:id/restore", authenticateUser, restoreFromTrash);

router.patch("/:id/star", authenticateUser, toggleStarFile);

router.delete("/:id", authenticateUser, deleteFile);


export default router;
