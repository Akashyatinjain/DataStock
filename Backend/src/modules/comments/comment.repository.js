import prisma from "../../config/db.js";

export const createComment = async (fileId, userId, content) => {
  return await prisma.comment.create({
    data: {
      content,
      fileId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });
};

export const getFileComments = async (fileId) => {
  return await prisma.comment.findMany({
    where: { fileId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });
};

export const findCommentById = async (commentId) => {
  return await prisma.comment.findUnique({
    where: { id: commentId },
  });
};

export const deleteComment = async (commentId) => {
  return await prisma.comment.delete({
    where: { id: commentId },
  });
};
