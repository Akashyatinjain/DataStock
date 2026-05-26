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


// ==========================
// UPLOAD FILE SERVICE
// ==========================

export const uploadFileService = async (
  file,
  userId
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
        uploadedFile.original_filename,

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
        userId
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

  return savedFile;
};


// ==========================
// GET USER FILES
// ==========================

export const getUserFilesService = async (
  userId
) => {

  return await fileRepo.getFilesByUserId(
    userId
  );
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

  return {
    message: "File deleted successfully"
  };
};