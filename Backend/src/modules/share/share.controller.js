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

  const share = await shareService.generatePublicLinkService(fileId, userId);

  const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${share.token}`;

  res.status(201).json({
    success: true,
    token: share.token,
    url: publicUrl,
  });
});

export const getPublicFile = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const file = await shareService.getPublicFileService(token);

  res.status(200).json({
    success: true,
    file,
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