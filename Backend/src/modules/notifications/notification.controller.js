import {
  getNotificationsService,
  createNotificationService,
  markAsReadService,
  markAllAsReadService
} from "./notification.service.js";

export const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await getNotificationsService(userId);
    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotificationController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;
    const notification = await createNotificationService(userId, message);
    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsReadController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const notification = await markAsReadService(id, userId);
    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsReadController = async (req, res) => {
  try {
    const userId = req.user.userId;
    await markAllAsReadService(userId);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};