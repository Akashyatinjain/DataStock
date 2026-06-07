import crypto from "crypto";

import * as shareRepo from "./share.repository.js";
import * as fileRepo from "../files/file.repository.js";

import {
  createNotificationService,
} from "../notifications/notification.service.js";

export const shareFileService = async (
  fileId,
  email,
  permission,
  userId
) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw new Error("File not found");
  }

  if (file.ownerId !== userId) {
    throw new Error("Unauthorized: you do not own this file");
  }

  const receiver = await shareRepo.findUserByEmail(email);

  if (!receiver) {
    throw new Error("No user found with that email address");
  }

  if (receiver.id === userId) {
    throw new Error("You cannot share a file with yourself");
  }

  const alreadyShared = await shareRepo.getShareByFileAndUser(
    fileId,
    receiver.id
  );

  if (alreadyShared) {
    throw new Error("File is already shared with this user");
  }

  const share = await shareRepo.createShare({
    fileId,
    sharedById: userId,
    sharedToId: receiver.id,
    permission: permission || "VIEW",
  });

  await createNotificationService(
    receiver.id,
    `"${file.originalName}" was shared with you`
  );

  return share;
};

export const getSharedWithMeService = async (userId) => {
  return shareRepo.getSharedFiles(userId);
};

export const getFileSharesService = async (fileId) => {
  return shareRepo.getFileShares(fileId);
};

export const removeShareService = async (shareId) => {
  return shareRepo.removeShare(shareId);
};

export const generatePublicLinkService = async (fileId, ownerId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw new Error("File not found");
  }

  if (file.ownerId !== ownerId) {
    throw new Error("Unauthorized: you do not own this file");
  }

  // Check if an active public share already exists for this file
  const existing = await shareRepo.getActivePublicShareByFile(fileId);
  if (existing) {
    return existing;
  }

  const token = crypto.randomBytes(32).toString("hex");

  return shareRepo.createPublicShare({
    token,
    fileId,
    ownerId,
  });
};

export const getPublicFileService = async (token) => {
  const share = await shareRepo.findPublicShareByToken(token);

  if (!share) {
    throw new Error("Share link not found or invalid");
  }

  if (!share.isActive) {
    throw new Error("This share link has been revoked");
  }

  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw new Error("This share link has expired");
  }

  return share.file;
};

export const revokePublicLinkService = async (token, userId) => {
  const share = await shareRepo.findPublicShareByToken(token);

  if (!share) {
    throw new Error("Share link not found");
  }

  if (share.ownerId !== userId) {
    throw new Error("Unauthorized: you did not create this link");
  }

  return shareRepo.revokePublicShare(token);
};