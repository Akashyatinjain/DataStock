import prisma from "../config/db.js";

export const logActivity = async (userId, message) => {
  try {
    if (!userId || !message) return;
    await prisma.activity.create({
      data: {
        userId,
        message
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
