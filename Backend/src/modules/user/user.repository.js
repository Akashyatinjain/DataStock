import { url } from "inspector";
import prisma from "../../config/db.js";

export const findUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      storageUsed: true,
      createdAt: true,
      imageUrl:true
    },
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
      storageUsed: true,
      imageUrl: true
    },
  });
};

export const updateUserImage = async (userId, imageUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl }
  });
};


export const updateUserProfileImage = async (userId, imageUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl },   // ✅ was: { imageUrl: url } — used wrong variable
    select: {
      id: true,
      imageUrl: true,
    },
  });
};