import * as userService from "./user.service.js";
import { uploadOnCloudinary } from "../../services/cloudinary.js";
import { updateUserProfileImage } from "./user.service.js";
import { updateUserById } from "./user.repository.js";


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
  const { username, name } = req.body;

  const updatedUser = await userService.updateUser(userId, username || name);

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

// export const updateUser = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { username } = req.body;

//     const updatedUser = await updateUserById(userId, username);

//     res.status(200).json({
//       message: "Username updated",
//       user: updatedUser,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { username, name } = req.body;

    const updatedUser =
      await userService.updateUser(
        userId,
        username || name
      );

    res.status(200).json({
      message: "Username updated",
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const user = await userService.deleteUserProfileImage(req.user.userId);

    return res.status(200).json({
      message: "Profile picture removed",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
