import prisma from "../../config/db.js";
import {
  findUserById,
  updateUserProfileImage as updateUserProfileImageRepo,
  deleteUserProfileImage as deleteUserProfileImageRepo,
  updateUserById,
} from "./user.repository.js";

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

// ======================
// GET STORAGE ACTIVITY
// ======================

const getCategoryKey = (mimeType = "") => {
  const type = mimeType.toLowerCase();
  if (type.startsWith("image/")) return "images";
  if (type.startsWith("video/")) return "videos";
  if (
    type.includes("pdf") ||
    type.includes("text") ||
    type.includes("document") ||
    type.includes("word") ||
    type.includes("sheet") ||
    type.includes("presentation")
  ) {
    return "documents";
  }
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("tar") ||
    type.includes("gzip") ||
    type.includes("compressed") ||
    type.includes("archive")
  ) {
    return "archives";
  }
  return "others";
};

const createEmptyCategories = () => ({
  images: { size: 0, count: 0 },
  videos: { size: 0, count: 0 },
  documents: { size: 0, count: 0 },
  archives: { size: 0, count: 0 },
  others: { size: 0, count: 0 },
});

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildUploadTrend = (files) => {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const dateKey = toLocalDateKey(date);
    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      dateKey,
      count: 0,
      size: 0,
    };
  });
  const byDate = new Map(days.map((day) => [day.dateKey, day]));

  files.forEach((file) => {
    const uploadedAt = file.createdAt ? new Date(file.createdAt) : null;
    if (!uploadedAt || Number.isNaN(uploadedAt.getTime())) return;

    const day = byDate.get(toLocalDateKey(uploadedAt));
    if (!day) return;

    day.count += 1;
    day.size += Number(file.size) || 0;
  });

  return days.map(({ dateKey, ...day }) => day);
};

export const getStorageActivity = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const activeFiles = await prisma.file.findMany({
    where: { ownerId: userId, isTrash: false },
    select: { size: true, mimeType: true, createdAt: true },
  });

  const trashFiles = await prisma.file.findMany({
    where: { ownerId: userId, isTrash: true },
    select: { size: true },
  });

  const activeUsed = activeFiles.reduce(
    (sum, file) => sum + (Number(file.size) || 0),
    0
  );
  const trashUsed = trashFiles.reduce(
    (sum, file) => sum + (Number(file.size) || 0),
    0
  );

  const categories = createEmptyCategories();
  activeFiles.forEach((file) => {
    const category = categories[getCategoryKey(file.mimeType)];
    category.count += 1;
    category.size += Number(file.size) || 0;
  });

  return {
    storageUsed: Number(user.storageUsed),
    storageLimit: Number(user.storageLimit),
    activeUsed,
    trashUsed,
    subscriptionPlan: user.subscriptionPlan,
    categories,
    uploadTrend: buildUploadTrend(activeFiles),
    trash: {
      size: trashUsed,
      count: trashFiles.length,
    },
    activeFileCount: activeFiles.length,
  };
};

export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error("UserId is required");
  }
  return await prisma.user.delete({
    where: { id: userId },
  });
};
