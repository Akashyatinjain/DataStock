import * as userService from "./user.service.js";
import prisma from "../../config/db.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../../services/cloudinary.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserProfile(userId);
    res.json({
      message: "User profile",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, name } = req.body;
    const updatedUser = await userService.updateUser(userId, username || name);
    res.json({
      message: "Profile updated",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    await userService.deleteUser(userId);
    res.clearCookie("token");
    res.json({
      message: "Account deleted"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCloudinaryImage = async (imageUrl) => {
  const publicId = getPublicIdFromUrl(imageUrl);
  if (!publicId) return;

  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.warn("Failed to delete old profile image from Cloudinary:", error.message);
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    const localFilePath = req.file?.path;
    if (!localFilePath) {
      return res.status(400).json({ message: "File is required" });
    }

    const currentUser = await userService.getUserProfile(req.user.userId);
    const previousImageUrl = currentUser?.imageUrl;

    const result = await uploadOnCloudinary(localFilePath);
    if (!result) {
      return res.status(500).json({ message: "Upload failed" });
    }

    await userService.updateUserProfileImage(req.user.userId, result.secure_url);

    if (previousImageUrl && previousImageUrl !== result.secure_url) {
      await removeCloudinaryImage(previousImageUrl);
    }

    return res.status(200).json({
      message: "Uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, name } = req.body;
    const updatedUser = await userService.updateUser(userId, username || name);
    res.status(200).json({
      message: "Username updated",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const currentUser = await userService.getUserProfile(req.user.userId);
    if (currentUser?.imageUrl) {
      await removeCloudinaryImage(currentUser.imageUrl);
    }

    const user = await userService.deleteUserProfileImage(req.user.userId);
    return res.status(200).json({
      message: "Profile picture removed",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStorageActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await userService.getStorageActivity(userId);
    res.json({ message: "Storage activity", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setupE2ee = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      encryptionSalt,
      encryptedMasterKey,
      masterKeyIv,
      publicKey,
      encryptedPrivateKey,
      privateKeyIv,
    } = req.body;

    const user = await userService.setupE2eeService(userId, {
      encryptionSalt,
      encryptedMasterKey,
      masterKeyIv,
      publicKey,
      encryptedPrivateKey,
      privateKeyIv,
    });

    res.status(200).json({
      success: true,
      message: "E2EE security keys configured successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicKeyByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email parameter is required" });
    }

    const publicKey = await userService.getPublicKeyByEmailService(email);
    res.status(200).json({
      success: true,
      publicKey,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
