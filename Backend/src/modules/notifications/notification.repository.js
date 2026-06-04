import prisma from "../../config/db.js";

export const createNotification = async (userId, message) => {
  return await prisma.notification.create({
    data: {
      userId,
      message,
    },
  });
};

export const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const markAsRead = async (notificationId, userId) => {
  return await prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
};

export const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};