import { findUserById } from "./user.repository.js";
import { updateUserProfileImage as updateUserProfileImageRepo } from "./user.repository.js";

export const getUserProfile = async (userId) => {

  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// user.service.js


export const updateUserProfileImage = async (userId, imageUrl) => {
  if (!userId || !imageUrl) {
    throw new Error("UserId and imageUrl are required");
  }

  const updatedUser = await updateUserProfileImageRepo(userId, imageUrl);

  return updatedUser;
};