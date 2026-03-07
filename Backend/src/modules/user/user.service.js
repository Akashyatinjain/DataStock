import { findUserById } from "./user.repository.js";

export const getUserProfile = async (userId) => {

  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

