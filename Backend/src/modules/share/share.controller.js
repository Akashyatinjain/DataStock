import asyncHandler from "../../utils/asyncHandler.js";
import * as shareService from "./share.service.js";

export const shareFile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileId, email, permission } = req.body;

  if (!fileId || !email) {
    return res.status(400).json({
      success: false,
      message: "fileId and email are required",
    });
  }

  const result = await shareService.shareFileService(
    fileId,
    email,
    permission,
    userId
  );

  return res.status(201).json({
    success: true,
    message: "File shared successfully",
    share: result,
  });
});

export const getSharedWithMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const shares = await shareService.getSharedWithMeService(userId);

  res.status(200).json({
    success: true,
    shares,
  });
});

export const getFileShares = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const shares = await shareService.getFileSharesService(fileId);

  res.status(200).json({
    success: true,
    shares,
  });
});

export const removeShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  await shareService.removeShareService(shareId);

  res.status(200).json({
    success: true,
    message: "Access removed successfully",
  });
});

export const generatePublicLink = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileId } = req.params;
  const { expiresAt, password, allowDownload } = req.body;

  const share = await shareService.generatePublicLinkService(fileId, userId, {
    expiresAt,
    password,
    allowDownload,
  });

  const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${share.token}`;

  res.status(201).json({
    success: true,
    token: share.token,
    url: publicUrl,
    share: {
      id: share.id,
      token: share.token,
      expiresAt: share.expiresAt,
      allowDownload: share.allowDownload,
      hasPassword: share.password !== null,
    }
  });
});

export const getPublicLinkInfo = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileId } = req.params;

  const info = await shareService.getPublicLinkInfoService(fileId, userId);

  let publicUrl = null;
  if (info) {
    publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${info.token}`;
  }

  res.status(200).json({
    success: true,
    share: info ? { ...info, url: publicUrl } : null,
  });
});

export const getPublicFile = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  const result = await shareService.getPublicFileService(token, password);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const verifyPublicFilePassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const result = await shareService.getPublicFileService(token, password);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const revokePublicLink = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { token } = req.params;

  await shareService.revokePublicLinkService(token, userId);

  res.status(200).json({
    success: true,
    message: "Public link revoked successfully",
  });
});

export const shareFolder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { folderId, email, permission } = req.body;

  if (!folderId || !email) {
    return res.status(400).json({
      success: false,
      message: "folderId and email are required",
    });
  }

  const result = await shareService.shareFolderService(
    folderId,
    email,
    permission,
    userId
  );

  return res.status(201).json({
    success: true,
    message: "Folder shared successfully",
    share: result,
  });
});

export const getFolderShares = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  const shares = await shareService.getFolderSharesService(folderId);

  res.status(200).json({
    success: true,
    shares,
  });
});

export const removeFolderShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  await shareService.removeFolderShareService(shareId);

  res.status(200).json({
    success: true,
    message: "Access removed successfully",
  });
});