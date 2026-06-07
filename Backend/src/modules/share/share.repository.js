import prisma from "../../config/db.js";

export const createShare = async (data) => {
  return prisma.fileShare.create({
    data,
    include: {
      sharedTo: {
        select: { id: true, username: true, email: true, imageUrl: true },
      },
    },
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const getShareByFileAndUser = async (fileId, sharedToId) => {
  return prisma.fileShare.findUnique({
    where: {
      fileId_sharedToId: { fileId, sharedToId },
    },
  });
};

export const getSharedFiles = async (userId) => {
  return prisma.fileShare.findMany({
    where: { sharedToId: userId },
    include: {
      file: true,
      sharedBy: {
        select: {
          id: true,
          username: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getFileShares = async (fileId) => {
  return prisma.fileShare.findMany({
    where: { fileId },
    include: {
      sharedTo: {
        select: {
          id: true,
          username: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const removeShare = async (shareId) => {
  return prisma.fileShare.delete({
    where: { id: shareId },
  });
};

export const createPublicShare = async (data) => {
  return prisma.publicShare.create({
    data,
    include: { file: true },
  });
};

export const findPublicShareByToken = async (token) => {
  return prisma.publicShare.findUnique({
    where: { token },
    include: { file: true },
  });
};

export const getActivePublicShareByFile = async (fileId) => {
  return prisma.publicShare.findFirst({
    where: { fileId, isActive: true },
  });
};

export const getPublicSharesByOwner = async (ownerId) => {
  return prisma.publicShare.findMany({
    where: { ownerId },
    include: { file: true },
    orderBy: { createdAt: "desc" },
  });
};

export const revokePublicShare = async (token) => {
  return prisma.publicShare.update({
    where: { token },
    data: { isActive: false },
  });
};