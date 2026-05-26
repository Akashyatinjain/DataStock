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


import { uploadOnCloudinary } from "../../services/cloudinary.js";

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