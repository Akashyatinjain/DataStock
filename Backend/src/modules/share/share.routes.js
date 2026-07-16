import express from "express";

import {
  shareFile,
  getSharedWithMe,
  getFileShares,
  removeShare,
  generatePublicLink,
  getPublicLinkInfo,
  getPublicFile,
  verifyPublicFilePassword,
  revokePublicLink,
} from "./share.controller.js";

import {
  authenticateUser,
} from "../../middleware/authMiddleware.js";

const router = express.Router();

// Share a file with another user by email
router.post("/file", authenticateUser, shareFile);

// Get all files shared with the current user
router.get("/shared-with-me", authenticateUser, getSharedWithMe);

// Get all shares for a specific file (who has access)
router.get("/file/:fileId", authenticateUser, getFileShares);

// Get active public link configuration info for a file
router.get("/public/info/:fileId", authenticateUser, getPublicLinkInfo);

// Generate or update a public link for a file
router.post("/public/:fileId", authenticateUser, generatePublicLink);

// Revoke a public link (MUST be before /:shareId so "public" isn't matched as shareId)
router.delete("/public/:token", authenticateUser, revokePublicLink);

// Get file info by public token (no auth required — public access)
router.get("/public/file/:token", getPublicFile);

// Verify password for a protected public link (no auth required)
router.post("/public/file/:token/verify", verifyPublicFilePassword);

// Remove a specific share entry (revoke one user's access) — keep LAST to avoid swallowing /public
router.delete("/:shareId", authenticateUser, removeShare);

export default router;