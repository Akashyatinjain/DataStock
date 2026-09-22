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
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

  return await prisma.notification.findUnique({
    where: {
      id: notificationId,
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

export const deleteNotification = async (notificationId, userId) => {
  return await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
};

export const clearAllNotifications = async (userId) => {
  return await prisma.notification.deleteMany({
    where: {
      userId,
    },
  });
};