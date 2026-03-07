import * as userService from "./user.service.js";

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