import * as folderRepo
from "./folder.repository.js";

import * as fileRepo
from "../files/file.repository.js";

import {
  deleteFromCloudinary
} from "../../services/cloudinary.js";

import prisma from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";
import { logActivity } from "../../utils/activityLogger.js";
import { getIO } from "../../socket.js";
import { checkFolderAccess } from "../../utils/permission.js";

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

  return Array.from(allFoldersMap.values());
};

export const deleteFolderService =
  async (
    folderId,
    userId
  ) => {

    // find folder
    const folder =
      await folderRepo.findFolderById(
        folderId
      );

    if (!folder) {
      throw new Error(
        "Folder not found"
      );
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

    for (const file of folder.files) {

      await deleteFromCloudinary(

        file.publicId,

        file.mimeType.startsWith("video")
          ? "video"
          : "image"
      );
    }

  

    await fileRepo.deleteFilesByFolderId(
      folderId
    );

    
    if (folder.children.length > 0) {

      await prisma.folder.deleteMany({

        where: {
          parentId: folderId
        }
      });
    }

 

    await folderRepo.deleteFolderById(
      folderId
    );

    await createNotificationService(userId, `Folder "${folder.name}" deleted successfully`);

    await logActivity(userId, `You deleted Folder "${folder.name}"`);

    // Broadcast folder deleted event
    const io = getIO();
    if (io) {
      io.to(`folder:${folder.parentId || 'root'}`).emit("folder_deleted", { folderId, parentId: folder.parentId || 'root' });
    }

    return {
      message:
        "Folder deleted successfully"
    };
};