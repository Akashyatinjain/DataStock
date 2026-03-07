import prisma from "../../config/db.js";

export const findUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      storageUsed: true,
      createdAt: true
    }
  });
};

export const updateUserById = async (userId, username) => {
  return prisma.user.update({
    where: { id: userId },
    data: { username },
    select: {
      id: true,
      username: true,
      email: true,
      storageUsed: true
    }
  });
};