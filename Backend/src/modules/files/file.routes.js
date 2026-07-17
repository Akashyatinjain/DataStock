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
  toggleArchiveFile,
  moveFile,
  getFileVersions,
  restoreVersion,
  deleteVersion,
  bulkTrashFiles,
  bulkStarFiles,
  bulkMoveFiles,
  bulkDeleteFiles,
  compressFiles,
  extractZip,
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

router.post("/bulk-trash", authenticateUser, bulkTrashFiles);
router.post("/bulk-star", authenticateUser, bulkStarFiles);
router.post("/bulk-move", authenticateUser, bulkMoveFiles);
router.post("/bulk-delete", authenticateUser, bulkDeleteFiles);
router.post("/compress", authenticateUser, compressFiles);
router.post("/:id/extract", authenticateUser, extractZip);

// Trash routes — must be before /:id to avoid "trash" being parsed as an id
router.get("/trash", authenticateUser, getTrashFiles);
router.delete("/trash", authenticateUser, emptyTrash);
router.patch("/:id/trash", authenticateUser, moveToTrash);
router.patch("/:id/restore", authenticateUser, restoreFromTrash);

router.patch("/:id/star", authenticateUser, toggleStarFile);
router.patch("/:id/archive", authenticateUser, toggleArchiveFile);
router.patch("/:id/move", authenticateUser, moveFile);

router.get("/:id/versions", authenticateUser, getFileVersions);
router.post("/:id/versions/:versionId/restore", authenticateUser, restoreVersion);
router.delete("/:id/versions/:versionId", authenticateUser, deleteVersion);

router.delete("/:id", authenticateUser, deleteFile);


export default router;
