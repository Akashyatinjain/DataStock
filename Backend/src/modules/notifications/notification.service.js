import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
} from "./notification.repository.js";
import { getIO } from "../../socket.js";

export const createNotificationService = async (userId, message) => {
  const notification = await createNotification(userId, message);

  // Broadcast to the user's Socket.io room
  const io = getIO();
  if (io) {
    io.to(userId).emit("notification", notification);
  }

  return notification;
};

export const getNotificationsService = async (userId) => {
  return await getNotifications(userId);
};

export const markAsReadService = async (notificationId, userId) => {
  return await markAsRead(notificationId, userId);
};

export const markAllAsReadService = async (userId) => {
  return await markAllAsRead(userId);
};