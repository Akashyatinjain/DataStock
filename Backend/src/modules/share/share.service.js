import crypto from "crypto";
import bcrypt from "bcrypt";

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
  const files = await shareRepo.getSharedFiles(userId);
  const folders = await shareRepo.getSharedFolders(userId);
  return { files, folders };
};

export const getFileSharesService = async (fileId) => {
  return shareRepo.getFileShares(fileId);
};

export const removeShareService = async (shareId) => {
  return shareRepo.removeShare(shareId);
};

export const shareFolderService = async (
  folderId,
  email,
  permission,
  userId
) => {
  const folder = await shareRepo.findFolderById(folderId);

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder.ownerId !== userId) {
    throw new Error("Unauthorized: you do not own this folder");
  }

  const receiver = await shareRepo.findUserByEmail(email);

  if (!receiver) {
    throw new Error("No user found with that email address");
  }

  if (receiver.id === userId) {
    throw new Error("You cannot share a folder with yourself");
  }

  const alreadyShared = await shareRepo.getFolderShareByFolderAndUser(
    folderId,
    receiver.id
  );

  if (alreadyShared) {
    throw new Error("Folder is already shared with this user");
  }

  const share = await shareRepo.createFolderShare({
    folderId,
    sharedById: userId,
    sharedToId: receiver.id,
    permission: permission || "VIEW",
  });

  await createNotificationService(
    receiver.id,
    `Folder "${folder.name}" was shared with you`
  );

  return share;
};

export const getFolderSharesService = async (folderId) => {
  return shareRepo.getFolderShares(folderId);
};

export const removeFolderShareService = async (shareId) => {
  return shareRepo.removeFolderShare(shareId);
};

export const generatePublicLinkService = async (fileId, ownerId, options = {}) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw new Error("File not found");
  }

  if (file.ownerId !== ownerId) {
    throw new Error("Unauthorized: you do not own this file");
  }

  const { expiresAt, password, allowDownload } = options;

  // Check if an active public share already exists for this file
  const existing = await shareRepo.getActivePublicShareByFile(fileId);
  if (existing) {
    const updateData = {
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      allowDownload: allowDownload !== undefined ? allowDownload : existing.allowDownload
    };
    if (password !== undefined) {
      updateData.password = password ? await bcrypt.hash(password, 10) : null;
    }
    return await shareRepo.updatePublicShare(existing.id, updateData);
  }

  const token = crypto.randomBytes(32).toString("hex");

  const data = {
    token,
    fileId,
    ownerId,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    allowDownload: allowDownload !== undefined ? allowDownload : true
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  return shareRepo.createPublicShare(data);
};

export const getPublicLinkInfoService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw new Error("File not found");
  }
  if (file.ownerId !== userId) {
    throw new Error("Unauthorized: you do not own this file");
  }

  const share = await shareRepo.getActivePublicShareByFile(fileId);
  if (!share) return null;

  return {
    id: share.id,
    token: share.token,
    expiresAt: share.expiresAt,
    allowDownload: share.allowDownload,
    hasPassword: share.password !== null
  };
};

export const getPublicFileService = async (token, password = null) => {
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

  if (share.password) {
    if (!password) {
      return {
        isPasswordProtected: true,
        fileName: share.file.originalName,
        mimeType: share.file.mimeType,
        size: share.file.size
      };
    }

    const isMatch = await bcrypt.compare(password, share.password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }
  }

  return {
    isPasswordProtected: false,
    file: share.file,
    allowDownload: share.allowDownload
  };
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