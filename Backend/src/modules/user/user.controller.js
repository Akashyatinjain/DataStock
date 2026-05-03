import * as userService from "./user.service.js";
import { uploadOnCloudinary } from "../../services/cloudinary.js";
import { updateUserProfileImage } from "./user.service.js";

export const getProfile = async(req, res) => {
   const userId = req.user.userId;

  const user = await userService.getUserProfile(userId);

   res.json({
      message: "User profile",
      user
   });
};

export const updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username } = req.body;

  const updatedUser = await userService.updateUser(userId, username);

  res.json({
    message: "Profile updated",
    user: updatedUser
  });
};

export const deleteAccount = async (req, res) => {
  const userId = req.user.userId;

  await userService.deleteUser(userId);

  res.clearCookie("token");

  res.json({
    message: "Account deleted"
  });
};

export const uploadProfileImage = async (req, res) => {
  try {
    const localFilePath = req.file?.path;

    if (!localFilePath) {
      return res.status(400).json({ message: "File is required" });
    }

    const result = await uploadOnCloudinary(localFilePath);

    if (!result) {
      return res.status(500).json({ message: "Upload failed" });
    }

    // ✅ SAVE IMAGE URL IN DB (CORRECT PLACE)
    await updateUserProfileImage(req.user.userId, result.secure_url);

    return res.status(200).json({
      message: "Uploaded successfully",
      imageUrl: result.secure_url
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

