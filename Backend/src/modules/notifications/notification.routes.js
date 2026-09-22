import express from "express";
import {
  getNotificationsController,
  createNotificationController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from "./notification.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, getNotificationsController);
router.post("/", authenticateUser, createNotificationController);
router.patch("/:id/read", authenticateUser, markAsReadController);
router.post("/read-all", authenticateUser, markAllAsReadController);
router.delete("/:id", authenticateUser, deleteNotificationController);
router.delete("/", authenticateUser, clearAllNotificationsController);

export default router;