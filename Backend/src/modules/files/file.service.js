// import {cloudinary, uploadOnCloudinary} from "../../services/cloudinary.js";

// import * as fileRepo from "./file.repository.js";

// import prisma from "../../config/db.js"

// export const uploadFilesService = async (file,userId) =>{
//     if(!file){
//         throw new Error("Please Enter the files first ");
//     }
//     const uploadedFile = await uploadOnCloudinary(file.path);
//     const savedFile = await fileRepo.createFile({
//         fileName:uploadedFile.original_filename,
//         originalName:uploadedFile.originalname,
//         url:uploadedFile.secure_url,
//         publicID:uploadedFile.public_id,
//         mimeType:file.mimetype,
//         size:uploadedFile.bytes,
//         ownerId:userId
//     })

//     await prisma.update({
//         where :{
//             id : userId
//         },
//         data :{
//             storageUsed:{
//                 increment :uploadedFile.bytes
//             }
//         }
//     })
//     return savedFile;
// }


// export const getUserFilesService = async (userId)=>{
//     return await fileRepo.getFilesByUserId(userId);
// }


import { uploadOnCloudinary,deleteFromCloudinary } from "../../services/cloudinary.js";

import * as fileRepo from "./file.repository.js";

import prisma from "../../config/db.js";
import { createNotificationService } from "../notifications/notification.service.js";

export const uploadFileService = async (
  file,
  userId,folderId
) => {

  if (!file) {
    throw new Error("File is required");
  }

  // upload to cloudinary
  const uploadedFile =
    await uploadOnCloudinary(file.path);

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
    throw new Error("File not found");
  }

  // ownership check
  if (file.ownerId !== userId) {
    throw new Error(
      "Unauthorized to delete this file"
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
    throw new Error("File not found");
  }

  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to update this file");
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
    throw new Error("File not found");
  }

  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to trash this file");
  }

  if (file.isTrash) {
    throw new Error("File is already in trash");
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
    throw new Error("File not found");
  }

  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to restore this file");
  }

  if (!file.isTrash) {
    throw new Error("File is not in trash");
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