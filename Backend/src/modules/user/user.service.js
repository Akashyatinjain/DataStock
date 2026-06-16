import { findUserById } from "./user.repository.js";
import {
  updateUserProfileImage as updateUserProfileImageRepo,
  deleteUserProfileImage as deleteUserProfileImageRepo,
} from "./user.repository.js";

import { updateUserById } from "./user.repository.js";

// ======================
// GET USER PROFILE
// ======================

export const getUserProfile = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ======================
// UPDATE PROFILE IMAGE
// ======================

export const updateUserProfileImage = async (
  userId,
  imageUrl
) => {
  if (!userId || !imageUrl) {
    throw new Error(
      "UserId and imageUrl are required"
    );
  }

  const updatedUser =
    await updateUserProfileImageRepo(
      userId,
      imageUrl
    );

  return updatedUser;
};

export const deleteUserProfileImage = async (userId) => {
  if (!userId) {
    throw new Error("UserId is required");
  }

  return await deleteUserProfileImageRepo(userId);
};

// ======================
// UPDATE USERNAME
// ======================

export const updateUser = async (
  userId,
  username
) => {
  if (!username) {
    throw new Error("Username is required");
  }

  return await updateUserById(
    userId,
    username
  );
};
