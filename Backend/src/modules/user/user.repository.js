import prisma from "../../config/db.js";

export const findUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      storageUsed: true,
      storageLimit: true,
      subscriptionPlan: true,
      subscriptionId: true,
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
      storageLimit: true,
      subscriptionPlan: true,
      subscriptionId: true,
      imageUrl: true
    },
  });
};

export const deleteUserProfileImage = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl: null },
    select: {
      id: true,
      username: true,
      email: true,
      storageUsed: true,
      storageLimit: true,
      subscriptionPlan: true,
      subscriptionId: true,
      imageUrl: true,
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

export const updateUserSubscription = async (userId, { subscriptionPlan, subscriptionId, dodoCustomerId, storageLimit }) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan,
      subscriptionId,
      dodoCustomerId,
      storageLimit,
    },
    select: {
      id: true,
      subscriptionPlan: true,
      subscriptionId: true,
      storageLimit: true,
    },
  });
};
