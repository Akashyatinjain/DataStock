import asyncHandler from "../../utils/asyncHandler.js";
import * as commentService from "./comment.service.js";

export const addComment = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const username = req.user.username || "Someone";
  const { fileId, content } = req.body;

  if (!fileId || !content || content.trim() === "") {
    return res.status(400).json({ success: false, message: "File ID and comment content are required" });
  }

  const comment = await commentService.addCommentService(fileId, userId, content, username);

  return res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comment,
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ success: false, message: "File ID is required" });
  }

  const comments = await commentService.getCommentsService(fileId);

  return res.status(200).json({
    success: true,
    comments,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await commentService.deleteCommentService(id, userId);

  return res.status(200).json(result);
});
