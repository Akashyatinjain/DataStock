import * as folderRepo
from "./folder.repository.js";

import * as fileRepo
from "../files/file.repository.js";

import {
  deleteFromCloudinary,
  resolveCloudinaryResourceType,
} from "../../services/cloudinary.js";

import prisma from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";
import { logActivity } from "../../utils/activityLogger.js";
import { getIO } from "../../socket.js";
import { checkFolderAccess } from "../../utils/permission.js";
import {
  getCache,
  setCache,
  invalidateUserFoldersCache,
  invalidateAllUserData,
} from "../../services/cache.service.js";

export const createFolderService = async (name,userId,parentId = null) => {

  if (!name) {
    throw new Error(
      "Folder name is required"
    );
  }

  if (parentId) {
    const parentAccess = await checkFolderAccess(parentId, userId);
    if (!parentAccess || parentAccess.permission !== "EDIT") {
      throw new Error("Unauthorized: You do not have edit permission for this folder");
    }
  }

  const folder = await folderRepo.createFolder({
    name,
    ownerId: userId,
    parentId
  });

  await invalidateUserFoldersCache(userId);

  await createNotificationService(userId, `Folder "${name}" created successfully`);

  await logActivity(userId, `You created Folder "${name}"`);

  // Broadcast folder created event
  const io = getIO();
  if (io) {
    io.to(`folder:${parentId || 'root'}`).emit("folder_created", folder);
  }

  return folder;
};


export const getFoldersService = async (userId) => {
  const cacheKey = `folders:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Get all folders owned by the user
  const ownedFolders = await prisma.folder.findMany({
    where: { ownerId: userId },
    include: {
      owner: { select: { id: true, username: true, email: true, imageUrl: true } },
      sharedWith: {
        include: {
          sharedTo: { select: { id: true, username: true, email: true, imageUrl: true } }
        }
      }
    }
  });

  // 2. Get all folders directly shared with the user
  const folderShares = await prisma.folderShare.findMany({
    where: { sharedToId: userId },
    include: {
      folder: {
        include: {
          owner: { select: { id: true, username: true, email: true, imageUrl: true } },
          sharedWith: {
            include: {
              sharedTo: { select: { id: true, username: true, email: true, imageUrl: true } }
            }
          }
        }
      }
    }
  });

  const directlySharedFolders = folderShares.map(fs => ({
    ...fs.folder,
    _sharedPermission: fs.permission,
    _shareId: fs.id,
    _isDirectlyShared: true
  }));

  // 3. For directly shared folders, find all their descendants recursively
  const allSharedDescendants = [];
  const visited = new Set();
  
  const fetchDescendants = async (folderId, parentPermission) => {
    if (visited.has(folderId)) return;
    visited.add(folderId);

    const children = await prisma.folder.findMany({
      where: { parentId: folderId },
      include: {
        owner: { select: { id: true, username: true, email: true, imageUrl: true } },
        sharedWith: {
          include: {
            sharedTo: { select: { id: true, username: true, email: true, imageUrl: true } }
          }
        }
      }
    });

    for (const child of children) {
      allSharedDescendants.push({
        ...child,
        _sharedPermission: parentPermission,
        _isSharedDescendant: true
      });
      await fetchDescendants(child.id, parentPermission);
    }
  };

  for (const sharedFolder of directlySharedFolders) {
    await fetchDescendants(sharedFolder.id, sharedFolder._sharedPermission);
  }

  // Combine owned, directly shared, and descendant shared folders
  const allFoldersMap = new Map();

  for (const folder of ownedFolders) {
    allFoldersMap.set(folder.id, {
      ...folder,
      _isOwner: true
    });
  }

  for (const folder of directlySharedFolders) {
    allFoldersMap.set(folder.id, folder);
  }

  for (const folder of allSharedDescendants) {
    if (!allFoldersMap.has(folder.id)) {
      allFoldersMap.set(folder.id, folder);
    }
  }

  const result = Array.from(allFoldersMap.values());
  await setCache(cacheKey, result, 300);
  return result;
};

export const deleteFolderService = async (folderId, userId) => {
  // find folder
  const folder = await folderRepo.findFolderById(folderId);

  if (!folder) {
    throw new Error("Folder not found");
  }

  let canDelete = folder.ownerId === userId;
  if (!canDelete && folder.parentId) {
    const parentAccess = await checkFolderAccess(folder.parentId, userId);
    if (parentAccess && parentAccess.permission === "EDIT") {
      canDelete = true;
    }
  }

  if (!canDelete) {
    throw new Error("Unauthorized: You do not have permission to delete this folder");
  }

  // 1. Recursively find all descendant folder IDs in subtree
  const allFolderIds = [folderId];
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await prisma.folder.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });
    for (const child of children) {
      allFolderIds.push(child.id);
      queue.push(child.id);
    }
  }

  // 2. Find all files residing within this folder or any of its subfolders
  const filesToDelete = await prisma.file.findMany({
    where: { folderId: { in: allFolderIds } },
    include: { versions: true },
  });

  const fileIdsToDelete = filesToDelete.map((f) => f.id);

  // 3. Delete files from Cloudinary and sum reclaimed storage
  let totalSizeFreed = 0;

  for (const file of filesToDelete) {
    const versions = file.versions || [];
    const uniquePublicIds = [
      ...new Set([file.publicId, ...versions.map((v) => v.publicId)].filter(Boolean)),
    ];

    for (const pid of uniquePublicIds) {
      const referencedElsewhere =
        (await prisma.fileVersion.count({
          where: {
            publicId: pid,
            fileId: { notIn: fileIdsToDelete },
          },
        })) +
        (await prisma.file.count({
          where: {
            publicId: pid,
            id: { notIn: fileIdsToDelete },
          },
        }));

      if (referencedElsewhere === 0) {
        try {
          await deleteFromCloudinary(pid, resolveCloudinaryResourceType(file.mimeType));
        } catch (err) {
          console.error(`Failed to delete asset ${pid} from Cloudinary:`, err);
        }
      }
    }

    const fileSize =
      versions.length > 0
        ? versions.reduce((sum, v) => sum + v.size, 0)
        : file.size;
    totalSizeFreed += fileSize;
  }

  // 4. Delete all files in these folders from the database (cascades file versions, shares, comments)
  if (fileIdsToDelete.length > 0) {
    await prisma.file.deleteMany({
      where: { id: { in: fileIdsToDelete } },
    });
  }

  // 5. Delete all subfolders and the folder itself in reverse order
  for (const fId of allFolderIds.slice().reverse()) {
    try {
      await prisma.folder.delete({
        where: { id: fId },
      });
    } catch (folderDelErr) {
      // Ignored if already cleaned up
    }
  }

  // 6. Reclaim user storage quota
  if (totalSizeFreed > 0) {
    await prisma.user.update({
      where: { id: folder.ownerId },
      data: {
        storageUsed: {
          decrement: totalSizeFreed,
        },
      },
    });
  }

  // 7. Invalidate all user data caches
  await invalidateAllUserData(userId);
  if (folder.ownerId !== userId) {
    await invalidateAllUserData(folder.ownerId);
  }

  await createNotificationService(userId, `Folder "${folder.name}" deleted successfully`);
  await logActivity(userId, `You deleted Folder "${folder.name}"`);

  // Broadcast folder deleted event
  const io = getIO();
  if (io) {
    io.to(`folder:${folder.parentId || "root"}`).emit("folder_deleted", {
      folderId,
      parentId: folder.parentId || "root",
    });
  }

  return {
    message: "Folder deleted successfully",
    deletedFilesCount: filesToDelete.length,
    deletedFoldersCount: allFolderIds.length,
  };
};

export const renameFolderService = async (folderId, newName, userId) => {
  if (!newName || typeof newName !== "string" || !newName.trim()) {
    const err = new Error("A valid folder name is required");
    err.statusCode = 400;
    err.code = "INVALID_FOLDER_NAME";
    throw err;
  }
  const trimmed = newName.trim();
  if (trimmed.length > 100) {
    const err = new Error("Folder name cannot exceed 100 characters");
    err.statusCode = 400;
    err.code = "NAME_TOO_LONG";
    throw err;
  }
  if (/[/\\?%*:|"<>]/g.test(trimmed)) {
    const err = new Error("Folder name contains invalid characters");
    err.statusCode = 400;
    err.code = "INVALID_CHARACTERS";
    throw err;
  }

  const folder = await folderRepo.findFolderById(folderId);
  if (!folder) {
    const err = new Error("Folder not found");
    err.statusCode = 404;
    err.code = "FOLDER_NOT_FOUND";
    throw err;
  }

  let canEdit = folder.ownerId === userId;
  if (!canEdit) {
    const access = await checkFolderAccess(folderId, userId);
    if (access && access.permission === "EDIT") {
      canEdit = true;
    }
  }

  if (!canEdit) {
    const err = new Error("Unauthorized: You do not have permission to rename this folder");
    err.statusCode = 403;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  // Check sibling collision
  const existingSibling = await prisma.folder.findFirst({
    where: {
      parentId: folder.parentId,
      ownerId: folder.ownerId,
      name: trimmed,
      id: { not: folderId }
    }
  });

  if (existingSibling) {
    const err = new Error("A folder with this name already exists in this location");
    err.statusCode = 409;
    err.code = "FOLDER_ALREADY_EXISTS";
    throw err;
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: { name: trimmed },
    include: {
      owner: { select: { id: true, username: true, email: true, imageUrl: true } }
    }
  });

  await invalidateUserFoldersCache(folder.ownerId);
  if (folder.ownerId !== userId) {
    await invalidateUserFoldersCache(userId);
  }

  await logActivity(userId, `You renamed folder "${folder.name}" to "${trimmed}"`);

  const io = getIO();
  if (io) {
    io.to(`folder:${folder.parentId || 'root'}`).emit("folder_renamed", updated);
  }

  return {
    folder: updated,
    message: "Folder renamed successfully"
  };
};