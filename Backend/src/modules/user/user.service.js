import prisma from "../../config/db.js";
import {
  findUserById,
  updateUserProfileImage as updateUserProfileImageRepo,
  deleteUserProfileImage as deleteUserProfileImageRepo,
  updateUserById,
  updateUserE2eeKeys,
} from "./user.repository.js";



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

export const setupE2eeService = async (userId, data) => {
  if (!userId) {
    throw new Error("UserId is required");
  }
  return await updateUserE2eeKeys(userId, data);
};

export const getPublicKeyByEmailService = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      publicKey: true,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.publicKey;
};

export const seedUserDemoData = async (userId) => {
  // Check if we have already seeded folders for this user
  const existingFolder = await prisma.folder.findFirst({
    where: { name: "Basanti", ownerId: userId }
  });
  if (existingFolder) {
    return;
  }

  // 1. Create collaborator (Sarah Connor) if not exists
  let collaborator = await prisma.user.findUnique({
    where: { email: "sarah@cyberdyne.org" },
  });
  if (!collaborator) {
    collaborator = await prisma.user.create({
      data: {
        username: "Sarah Connor",
        email: "sarah@cyberdyne.org",
        password: "dummy_password_hash",
        authProvider: "local",
        subscriptionPlan: "BASIC",
      },
    });
  }

  // 2. Create folders
  const basantiFolder = await prisma.folder.create({
    data: { name: "Basanti", ownerId: userId },
  });

  // Share "Basanti" folder with Sarah Connor
  await prisma.folderShare.create({
    data: {
      folderId: basantiFolder.id,
      sharedById: userId,
      sharedToId: collaborator.id,
      permission: "VIEW",
    },
  });

  const pitchFolder = await prisma.folder.create({
    data: { name: "Project Pitch", ownerId: userId },
  });

  const legalFolder = await prisma.folder.create({
    data: { name: "Legal Templates", ownerId: userId },
  });

  // 3. Seed files across categories (Images, Videos, PDFs, Encrypted)
  const filesToSeed = [
    // Root files
    { name: "Brand_Styleguide.pdf", mime: "application/pdf", size: 8912896, folderId: null },
    { name: "Dashboard_Mockup_V1.png", mime: "image/png", size: 2516582, folderId: null },
    { name: "Secure_Credentials.key", mime: "application/octet-stream", size: 1024, folderId: null, isEncrypted: true },

    // "Basanti" folder files
    { name: "Sprint_Demo_Recording.mp4", mime: "video/mp4", size: 47290777, folderId: basantiFolder.id },
    { name: "Team_Photo.jpg", mime: "image/jpeg", size: 4325376, folderId: basantiFolder.id },

    // "Project Pitch" folder files
    { name: "Investor_Pitch_Deck.pdf", mime: "application/pdf", size: 7025459, folderId: pitchFolder.id },
    { name: "Promotional_Video_Teaser.mp4", mime: "video/mp4", size: 33973862, folderId: pitchFolder.id },

    // "Legal Templates" folder files
    { name: "Standard_NDA.pdf", mime: "application/pdf", size: 419430, folderId: legalFolder.id },
  ];

  for (const item of filesToSeed) {
    const dummyUrl = `https://res.cloudinary.com/dummy-cloud/image/upload/v1/${item.name}`;
    const data = {
      fileName: item.name,
      originalName: item.name,
      url: dummyUrl,
      publicId: `dummy_${item.name.replace(/\./g, "_")}_id`,
      mimeType: item.mime,
      size: item.size,
      isStarred: item.isStarred || false,
      isEncrypted: item.isEncrypted || false,
      ownerId: userId,
      folderId: item.folderId,
    };

    if (item.isEncrypted) {
      data.encryptedKey = "6ZN5SyACIN7dXg+nskZs7Uh5iviAuOcHpvCUevnQuWD0Q8E9Vg==";
      data.fileIv = "iv_placeholder_base64==";
      data.nameIv = "name_placeholder_base64==";
      data.originalName = "6ZN5SyACIN7dXg+nskZs7Uh5iviAuOcHpvCUevnQuWD0Q8E9Vg==";
    }

    await prisma.file.create({
      data: {
        ...data,
        versions: {
          create: {
            versionNumber: 1,
            url: dummyUrl,
            publicId: data.publicId,
            size: item.size,
            isEncrypted: item.isEncrypted,
            encryptedKey: item.isEncrypted ? data.encryptedKey : null,
            fileIv: item.isEncrypted ? data.fileIv : null,
          },
        },
      },
    });
  }

  // Update user's storageUsed
  const totalSeededSize = filesToSeed.reduce((acc, file) => acc + file.size, 0);
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsed: totalSeededSize },
  });
};
