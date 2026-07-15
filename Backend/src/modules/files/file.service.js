import { uploadOnCloudinary, deleteFromCloudinary } from "../../services/cloudinary.js";

import * as fileRepo from "./file.repository.js";

import prisma from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";

// ── Helper: create a typed error ──
const createError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

export const uploadFileService = async (
  file,
  userId, folderId
) => {

  if (!file) {
    throw createError("File is required", 400, "NO_FILE_PROVIDED");
  }

  // ── Storage quota check ──
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, storageLimit: true, subscriptionPlan: true },
  });

  if (!user) {
    throw createError("User not found", 404, "USER_NOT_FOUND");
  }

  const storageLimit = Number(user.storageLimit) || 10 * 1024 * 1024 * 1024; // default 10 GB
  const storageUsed = Number(user.storageUsed) || 0;
  const remaining = storageLimit - storageUsed;

  if (file.size > remaining) {
    // Clean up the temp file
    const fs = await import("fs");
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
    const limitMB = (storageLimit / (1024 * 1024)).toFixed(0);
    throw createError(
      `Storage quota exceeded. You have ${usedMB} MB used out of ${limitMB} MB. This file (${(file.size / (1024 * 1024)).toFixed(1)} MB) won't fit.`,
      403,
      "STORAGE_QUOTA_EXCEEDED"
    );
  }

  // ── Upload to Cloudinary ──
  let uploadedFile;
  try {
    uploadedFile = await uploadOnCloudinary(file.path);
  } catch (cloudErr) {
    throw createError(
      cloudErr.message || "Failed to upload file to cloud storage. Please try again.",
      502,
      "CLOUD_UPLOAD_FAILED"
    );
  }

  // save metadata in db
const savedFile =
  await fileRepo.createFile({

    fileName:
      uploadedFile.public_id,

    originalName:
      file.originalname,

    url:
      uploadedFile.secure_url,

    publicId:
      uploadedFile.public_id,

    mimeType:
      file.mimetype,

    size:
      uploadedFile.bytes,

    ownerId:
      userId,

    folderId:
      folderId || null
  });

  // update user storage used
  await prisma.user.update({

    where: {
      id: userId
    },

    data: {
      storageUsed: {
        increment: uploadedFile.bytes
      }
    }
  });

  await createNotificationService(
    userId,
    `File "${file.originalname}" uploaded successfully`
  );

  return {
    savedFile,
    message: "File uploaded successfully"
  };
};



export const getUserFilesService =
  async (
    userId,
    folderId = null
  ) => {

    return await fileRepo.getFilesByUserId(

      userId,

      folderId
    );
};

export const getAllUserFilesService = async (userId) => {
  return fileRepo.getAllFilesByUserId(userId);
};

export const deleteFileService = async (
  fileId,
  userId
) => {

  // find file
  const file =
    await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  // ownership check
  if (file.ownerId !== userId) {
    throw createError(
      "Unauthorized to delete this file",
      403,
      "UNAUTHORIZED"
    );
  }

  // delete from cloudinary
  await deleteFromCloudinary(
    file.publicId,
    file.mimeType.startsWith("video")
      ? "video"
      : "image"
  );

  // delete from db
  await fileRepo.deleteFileById(fileId);

  // decrease storage used
  await prisma.user.update({

    where: {
      id: userId
    },

    data: {
      storageUsed: {
        decrement: file.size
      }
    }
  });

  await createNotificationService(
    userId,
    `File "${file.originalName}" deleted successfully`
  );
  return {
    message: "File deleted successfully"
  };
};

export const toggleStarFileService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  if (file.ownerId !== userId) {
    throw createError("Unauthorized to update this file", 403, "UNAUTHORIZED");
  }

  const updatedFile = await fileRepo.updateFileStarred(
    fileId,
    !file.isStarred
  );

  return {
    file: updatedFile,
    message: updatedFile.isStarred
      ? "File added to starred"
      : "File removed from starred",
  };
};

export const moveToTrashService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  if (file.ownerId !== userId) {
    throw createError("Unauthorized to trash this file", 403, "UNAUTHORIZED");
  }

  if (file.isTrash) {
    throw createError("File is already in trash", 400, "ALREADY_TRASHED");
  }

  const trashedFile = await fileRepo.moveFileToTrash(fileId);

  await createNotificationService(
    userId,
    `File "${file.originalName}" moved to trash`
  );

  return {
    file: trashedFile,
    message: "File moved to trash",
  };
};

export const restoreFromTrashService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  if (file.ownerId !== userId) {
    throw createError("Unauthorized to restore this file", 403, "UNAUTHORIZED");
  }

  if (!file.isTrash) {
    throw createError("File is not in trash", 400, "NOT_IN_TRASH");
  }

  const restoredFile = await fileRepo.restoreFileFromTrash(fileId);

  await createNotificationService(
    userId,
    `File "${file.originalName}" restored from trash`
  );

  return {
    file: restoredFile,
    message: "File restored from trash",
  };
};

export const getTrashFilesService = async (userId) => {
  return fileRepo.getTrashFilesByUserId(userId);
};

export const emptyTrashService = async (userId) => {
  const trashedFiles = await fileRepo.getTrashFilesByUserId(userId);

  if (trashedFiles.length === 0) {
    return { message: "Trash is already empty", deletedCount: 0 };
  }

  let totalSizeFreed = 0;

  for (const file of trashedFiles) {
    // delete from cloudinary
    await deleteFromCloudinary(
      file.publicId,
      file.mimeType.startsWith("video") ? "video" : "image"
    );

    // delete from db
    await fileRepo.deleteFileById(file.id);

    totalSizeFreed += file.size;
  }

  // decrease storage used
  if (totalSizeFreed > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          decrement: totalSizeFreed,
        },
      },
    });
  }

  await createNotificationService(
    userId,
    `Trash emptied — ${trashedFiles.length} file(s) permanently deleted`
  );

  return {
    message: "Trash emptied successfully",
    deletedCount: trashedFiles.length,
  };
};

export const toggleArchiveFileService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  if (file.ownerId !== userId) {
    throw createError("Unauthorized to update this file", 403, "UNAUTHORIZED");
  }

  if (file.isTrash) {
    throw createError("Cannot archive a file that is in the trash", 400, "CANNOT_ARCHIVE_TRASHED");
  }

  const updatedFile = await fileRepo.updateFileArchived(
    fileId,
    !file.isArchived
  );

  await createNotificationService(
    userId,
    `File "${file.originalName}" ${updatedFile.isArchived ? "archived" : "unarchived"} successfully`
  );

  return {
    file: updatedFile,
    message: updatedFile.isArchived
      ? "File archived successfully"
      : "File unarchived successfully",
  };
};

export const moveFileService = async (fileId, folderId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  if (file.ownerId !== userId) {
    throw createError("Unauthorized to move this file", 403, "UNAUTHORIZED");
  }

  if (file.isTrash) {
    throw createError("Cannot move a file that is in the trash", 400, "CANNOT_MOVE_TRASHED");
  }

  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw createError("Target folder not found", 404, "FOLDER_NOT_FOUND");
    }

    if (folder.ownerId !== userId) {
      throw createError("Unauthorized to move to this folder", 403, "UNAUTHORIZED");
    }
  }

  const updatedFile = await fileRepo.updateFileFolder(fileId, folderId);

  await createNotificationService(
    userId,
    `File "${file.originalName}" moved successfully`
  );

  return {
    file: updatedFile,
    message: "File moved successfully",
  };
};