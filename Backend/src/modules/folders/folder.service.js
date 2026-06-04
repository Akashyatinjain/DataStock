import * as folderRepo
from "./folder.repository.js";

import * as fileRepo
from "../files/file.repository.js";

import {
  deleteFromCloudinary
} from "../../services/cloudinary.js";

import prisma
from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";
export const createFolderService = async (name,userId,parentId = null) => {

  if (!name) {
    throw new Error(
      "Folder name is required"
    );
  }

  const folder = await folderRepo.createFolder({
    name,
    ownerId: userId,
    parentId
  });

  await createNotificationService(userId, `Folder "${name}" created successfully`);

  return folder;
};


export const getFoldersService = async (userId) => {

  return await folderRepo.getFoldersByUserId(
    userId
  );
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

    if (folder.ownerId !== userId) {
      throw new Error(
        "Unauthorized"
      );
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

    return {
      message:
        "Folder deleted successfully"
    };
};