import * as commentRepo from "./comment.repository.js";
import * as fileRepo from "../files/file.repository.js";
import { createNotificationService } from "../notifications/notification.service.js";
import { getIO } from "../../socket.js";

export const addCommentService = async (fileId, userId, content, username) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw new Error("File not found");
  }

  const comment = await commentRepo.createComment(fileId, userId, content);

  // Broadcast to anyone previewing this file
  const io = getIO();
  if (io) {
    io.to(`file:${fileId}`).emit("new_comment", comment);
  }

  // Notify the file owner if someone else commented on their file
  if (file.ownerId !== userId) {
    await createNotificationService(
      file.ownerId,
      `${username} commented on your file "${file.originalName}"`
    );
  }

  return comment;
};

export const getCommentsService = async (fileId) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw new Error("File not found");
  }
  return await commentRepo.getFileComments(fileId);
};

export const deleteCommentService = async (commentId, userId) => {
  const comment = await commentRepo.findCommentById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Only allow commenter or file owner to delete the comment
  const file = await fileRepo.findFileById(comment.fileId);
  if (comment.userId !== userId && file.ownerId !== userId) {
    throw new Error("Unauthorized to delete this comment");
  }

  await commentRepo.deleteComment(commentId);

  // Broadcast comment deletion
  const io = getIO();
  if (io) {
    io.to(`file:${comment.fileId}`).emit("comment_deleted", { commentId, fileId: comment.fileId });
  }

  return { success: true, message: "Comment deleted successfully" };
};
