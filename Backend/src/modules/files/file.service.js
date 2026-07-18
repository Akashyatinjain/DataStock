import { uploadOnCloudinary, deleteFromCloudinary } from "../../services/cloudinary.js";

import * as fileRepo from "./file.repository.js";
import { extractText } from "../../utils/ocr.js";
import { logActivity } from "../../utils/activityLogger.js";

import prisma from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";
import { getIO } from "../../socket.js";
import { checkFolderAccess, checkFileAccess } from "../../utils/permission.js";
import { seedUserDemoData } from "../user/user.service.js";

// ── Helper: create a typed error ──
const createError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

export const uploadFileService = async (
  file,
  userId, folderId,
  fileId = null,
  e2eeData = {}
) => {

  if (!file) {
    throw createError("File is required", 400, "NO_FILE_PROVIDED");
  }

  if (folderId) {
    const parentAccess = await checkFolderAccess(folderId, userId);
    if (!parentAccess || parentAccess.permission !== "EDIT") {
      throw createError("Unauthorized: You do not have edit permission for this folder", 403, "UNAUTHORIZED");
    }
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

  // ── OCR & Content Indexing (Skip if E2EE) ──
  let ocrText = null;
  if (!e2eeData.isEncrypted) {
    try {
      ocrText = await extractText(file.path, file.mimetype);
    } catch (ocrErr) {
      console.error("OCR Extraction failed:", ocrErr);
    }
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

  // Check if file is explicitly provided by ID or matched by name
  const existingFile = fileId
    ? await prisma.file.findUnique({
        where: { id: fileId },
        include: { versions: true }
      })
    : await prisma.file.findFirst({
        where: {
          originalName: e2eeData.isEncrypted ? (e2eeData.encryptedName || file.originalname) : file.originalname,
          folderId: folderId || null,
          ownerId: userId,
          isTrash: false,
        },
        include: {
          versions: true,
        }
      });

  let savedFile;
  let isNewVersion = false;

  if (existingFile) {
    isNewVersion = true;
    const nextVersionNumber = existingFile.versions.length > 0
      ? Math.max(...existingFile.versions.map(v => v.versionNumber)) + 1
      : 2;

    await prisma.fileVersion.create({
      data: {
        fileId: existingFile.id,
        versionNumber: nextVersionNumber,
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        size: uploadedFile.bytes,
        isEncrypted: e2eeData.isEncrypted || false,
        encryptedKey: e2eeData.encryptedKey || null,
        fileIv: e2eeData.fileIv || null,
      }
    });

    savedFile = await prisma.file.update({
      where: { id: existingFile.id },
      data: {
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        size: uploadedFile.bytes,
        ocrText: ocrText,
        mimeType: e2eeData.isEncrypted ? (e2eeData.originalMimeType || file.mimetype) : file.mimetype,
        isEncrypted: e2eeData.isEncrypted || false,
        encryptedKey: e2eeData.encryptedKey || null,
        fileIv: e2eeData.fileIv || null,
        nameIv: e2eeData.nameIv || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        versions: true,
      }
    });
  } else {
    savedFile = await fileRepo.createFile({
      fileName: uploadedFile.public_id,
      originalName: e2eeData.isEncrypted ? (e2eeData.encryptedName || file.originalname) : file.originalname,
      url: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      mimeType: e2eeData.isEncrypted ? (e2eeData.originalMimeType || file.mimetype) : file.mimetype,
      size: uploadedFile.bytes,
      ownerId: userId,
      folderId: folderId || null,
      ocrText: ocrText,
      isEncrypted: e2eeData.isEncrypted || false,
      encryptedKey: e2eeData.encryptedKey || null,
      fileIv: e2eeData.fileIv || null,
      nameIv: e2eeData.nameIv || null,
    });
  }

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
    isNewVersion
      ? `File "${file.originalname}" updated with version ${savedFile.versions.length}`
      : `File "${file.originalname}" uploaded successfully`
  );

  await logActivity(
    userId,
    isNewVersion
      ? `You uploaded version ${savedFile.versions.length} of file "${file.originalname}"`
      : `You uploaded file "${file.originalname}"`
  );

  // Broadcast file uploaded event
  const io = getIO();
  if (io) {
    io.to(`folder:${folderId || 'root'}`).emit("file_uploaded", {
      ...savedFile,
      owner: {
        id: userId,
        username: user?.username || "Someone",
        imageUrl: user?.imageUrl || null,
        email: user?.email || ""
      }
    });
  }

  return {
    savedFile,
    message: isNewVersion ? "New file version uploaded successfully" : "File uploaded successfully"
  };
};



export const getUserFilesService =
  async (
    userId,
    folderId = null
  ) => {
    if (!folderId) {
      // Auto-seed demo data if empty
      const fileCount = await prisma.file.count({ where: { ownerId: userId } });
      const folderCount = await prisma.folder.count({ where: { ownerId: userId } });
      if (fileCount === 0 && folderCount === 0) {
        try {
          await seedUserDemoData(userId);
        } catch (err) {
          console.error("Failed to seed user demo data during files fetch:", err);
        }
      }
    }

    if (folderId) {
      const access = await checkFolderAccess(folderId, userId);
      if (!access) {
        throw createError("Unauthorized to view this folder", 403, "UNAUTHORIZED");
      }
      return await prisma.file.findMany({
        where: {
          folderId,
          isTrash: false,
          isArchived: false
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    }

    return await fileRepo.getFilesByUserId(userId, null);
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

  // ownership/permission check
  const access = await checkFileAccess(fileId, userId);
  if (!access || access.permission !== "EDIT") {
    throw createError(
      "Unauthorized to delete this file",
      403,
      "UNAUTHORIZED"
    );
  }

  // delete all versions from cloudinary only if they are not referenced by other active files or versions elsewhere
  const versions = file.versions || [];
  const uniquePublicIds = [...new Set([
    file.publicId,
    ...versions.map(v => v.publicId)
  ].filter(Boolean))];

  for (const pid of uniquePublicIds) {
    const referencedElsewhere = await prisma.fileVersion.count({
      where: {
        publicId: pid,
        fileId: { not: fileId }
      }
    }) + await prisma.file.count({
      where: {
        publicId: pid,
        id: { not: fileId }
      }
    });

    if (referencedElsewhere === 0) {
      try {
        await deleteFromCloudinary(
          pid,
          file.mimeType.startsWith("video") ? "video" : "image"
        );
      } catch (err) {
        console.error(`Failed to delete asset ${pid} from Cloudinary:`, err);
      }
    }
  }

  // delete from db (cascade delete handles database FileVersion records)
  await fileRepo.deleteFileById(fileId);

  // sum total size of all versions to reclaim storage quota
  const totalSize = versions.length > 0
    ? versions.reduce((sum, v) => sum + v.size, 0)
    : file.size;

  // decrease storage used
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      storageUsed: {
        decrement: totalSize
      }
    }
  });

  await createNotificationService(
    userId,
    `File "${file.originalName}" deleted permanently`
  );

  await logActivity(
    userId,
    `You permanently deleted file "${file.originalName}"`
  );

  // Broadcast file deleted event
  const io = getIO();
  if (io) {
    io.to(`folder:${file.folderId || 'root'}`).emit("file_deleted", { fileId, folderId: file.folderId || 'root' });
  }

  return {
    message: "File deleted successfully"
  };
};

export const toggleStarFileService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);

  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }

  const access = await checkFileAccess(fileId, userId);
  if (!access || access.permission !== "EDIT") {
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

  const access = await checkFileAccess(fileId, userId);
  if (!access || access.permission !== "EDIT") {
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

  await logActivity(
    userId,
    `You moved file "${file.originalName}" to Trash`
  );

  // Broadcast file trashing (hides it from the current folder)
  const io = getIO();
  if (io) {
    io.to(`folder:${file.folderId || 'root'}`).emit("file_deleted", { fileId, folderId: file.folderId || 'root' });
  }

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

  const access = await checkFileAccess(fileId, userId);
  if (!access || access.permission !== "EDIT") {
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

  await logActivity(
    userId,
    `You restored file "${file.originalName}" from Trash`
  );

  // Broadcast restored file
  const io = getIO();
  if (io) {
    io.to(`folder:${restoredFile.folderId || 'root'}`).emit("file_uploaded", restoredFile);
  }

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

  const trashedFileIds = trashedFiles.map(f => f.id);

  for (const file of trashedFiles) {
    const versions = file.versions || [];
    const uniquePublicIds = [...new Set([
      file.publicId,
      ...versions.map(v => v.publicId)
    ].filter(Boolean))];

    for (const pid of uniquePublicIds) {
      const referencedElsewhere = await prisma.fileVersion.count({
        where: {
          publicId: pid,
          fileId: { notIn: trashedFileIds }
        }
      }) + await prisma.file.count({
        where: {
          publicId: pid,
          id: { notIn: trashedFileIds }
        }
      });

      if (referencedElsewhere === 0) {
        try {
          await deleteFromCloudinary(
            pid,
            file.mimeType.startsWith("video") ? "video" : "image"
          );
        } catch (err) {
          console.error(`Failed to delete asset ${pid} from Cloudinary:`, err);
        }
      }
    }

    const fileSize = versions.length > 0
      ? versions.reduce((sum, v) => sum + v.size, 0)
      : file.size;
    totalSizeFreed += fileSize;

    // delete from db
    await fileRepo.deleteFileById(file.id);
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

  await logActivity(
    userId,
    `You emptied the Trash (${trashedFiles.length} file(s) permanently deleted)`
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

  const access = await checkFileAccess(fileId, userId);
  if (!access || access.permission !== "EDIT") {
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

  const fileAccess = await checkFileAccess(fileId, userId);
  if (!fileAccess || fileAccess.permission !== "EDIT") {
    throw createError("Unauthorized to move this file", 403, "UNAUTHORIZED");
  }

  if (file.isTrash) {
    throw createError("Cannot move a file that is in the trash", 400, "CANNOT_MOVE_TRASHED");
  }

  if (folderId) {
    const folderAccess = await checkFolderAccess(folderId, userId);
    if (!folderAccess || folderAccess.permission !== "EDIT") {
      throw createError("Unauthorized to move to this folder", 403, "UNAUTHORIZED");
    }
  }

  const updatedFile = await fileRepo.updateFileFolder(fileId, folderId);

  await createNotificationService(
    userId,
    `File "${file.originalName}" moved successfully`
  );

  // Broadcast file moved to rooms
  const io = getIO();
  if (io) {
    // Notify source folder to remove file
    io.to(`folder:${file.folderId || 'root'}`).emit("file_deleted", { fileId, folderId: file.folderId || 'root' });
    // Notify target folder to add file
    io.to(`folder:${folderId || 'root'}`).emit("file_uploaded", updatedFile);
  }

  return {
    file: updatedFile,
    message: "File moved successfully",
  };
};

export const getFileVersionsService = async (fileId, userId) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }
  if (file.ownerId !== userId) {
    throw createError("Unauthorized to view this file's versions", 403, "UNAUTHORIZED");
  }
  return await fileRepo.getFileVersionsByFileId(fileId);
};

export const restoreVersionService = async (fileId, versionId, userId) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }
  if (file.ownerId !== userId) {
    throw createError("Unauthorized to modify this file", 403, "UNAUTHORIZED");
  }

  const version = await fileRepo.findVersionById(versionId);
  if (!version || version.fileId !== fileId) {
    throw createError("Version not found for this file", 404, "VERSION_NOT_FOUND");
  }

  const versions = await fileRepo.getFileVersionsByFileId(fileId);
  const nextVersionNumber = versions.length > 0
    ? Math.max(...versions.map(v => v.versionNumber)) + 1
    : 2;

  await prisma.fileVersion.create({
    data: {
      fileId: fileId,
      versionNumber: nextVersionNumber,
      url: version.url,
      publicId: version.publicId,
      size: version.size,
    }
  });

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      url: version.url,
      publicId: version.publicId,
      size: version.size,
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          email: true,
        }
      },
      versions: true,
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: {
        increment: version.size
      }
    }
  });

  await createNotificationService(
    userId,
    `File "${file.originalName}" restored to version ${version.versionNumber}`
  );

  const io = getIO();
  if (io) {
    io.to(`folder:${file.folderId || 'root'}`).emit("file_uploaded", updatedFile);
  }

  return {
    file: updatedFile,
    message: `File restored to version ${version.versionNumber} successfully`,
  };
};

export const deleteVersionService = async (fileId, versionId, userId) => {
  const file = await fileRepo.findFileById(fileId);
  if (!file) {
    throw createError("File not found", 404, "FILE_NOT_FOUND");
  }
  if (file.ownerId !== userId) {
    throw createError("Unauthorized to modify this file", 403, "UNAUTHORIZED");
  }

  const version = await fileRepo.findVersionById(versionId);
  if (!version || version.fileId !== fileId) {
    throw createError("Version not found", 404, "VERSION_NOT_FOUND");
  }

  const versionCount = await fileRepo.findFileVersionCount(fileId);
  if (versionCount <= 1) {
    throw createError("Cannot delete the only remaining version of a file", 400, "CANNOT_DELETE_LAST_VERSION");
  }

  const maxVersion = await prisma.fileVersion.findFirst({
    where: { fileId },
    orderBy: { versionNumber: "desc" }
  });
  const isCurrentActive = maxVersion && maxVersion.id === versionId;

  // Only delete from Cloudinary if no other file or version references this publicId
  const referencedElsewhere = await prisma.fileVersion.count({
    where: {
      publicId: version.publicId,
      id: { not: versionId }
    }
  }) + await prisma.file.count({
    where: {
      publicId: version.publicId,
      id: { not: fileId }
    }
  });

  if (referencedElsewhere === 0 && version.publicId) {
    try {
      await deleteFromCloudinary(
        version.publicId,
        file.mimeType.startsWith("video") ? "video" : "image"
      );
    } catch (err) {
      console.error(`Failed to delete version asset ${version.publicId} from Cloudinary:`, err);
    }
  }

  await fileRepo.deleteVersionById(versionId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: {
        decrement: version.size
      }
    }
  });

  let updatedFile;
  if (isCurrentActive) {
    const remainingVersions = await fileRepo.getFileVersionsByFileId(fileId);
    const newActiveVersion = remainingVersions[0];

    updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        url: newActiveVersion.url,
        publicId: newActiveVersion.publicId,
        size: newActiveVersion.size,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        versions: true,
      }
    });
  } else {
    updatedFile = await fileRepo.findFileById(fileId);
  }

  await createNotificationService(
    userId,
    `Version ${version.versionNumber} of file "${file.originalName}" was deleted`
  );

  const io = getIO();
  if (io) {
    io.to(`folder:${file.folderId || 'root'}`).emit("file_uploaded", updatedFile);
  }

  return {
    file: updatedFile,
    message: `Version ${version.versionNumber} deleted successfully`,
  };
};