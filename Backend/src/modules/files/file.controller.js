// import asyncHandler from "../../utils/asyncHandler.js"

// import * as fileService from "./file.service.js"

// export const uploadFile = asyncHandler(
//     async (req,res) =>{
//         const userId = req.user.userId;
//         const file = req.file;
//         const uploadedFile= await fileService.uploadFilesService(file,userId);
//         return res.status(200).json({
//             sucess:true,
//             message: "File uploaded successfully",
//             file: uploadedFile
//         })
//     }
// )

// export const getUserFiles = asyncHandler(
//     async (req,res) =>{
//         const userId =req.user.userId;
//         const file = req.file;
//         const uploadedFile = await fileService.getUserFilesService(userId);
//         return res.status(200).json({
//             success: true,
//             files
//         });
//     }
// )



import asyncHandler from "../../utils/asyncHandler.js";

import * as fileService from "./file.service.js";


// ==========================
// UPLOAD FILE
// ==========================

export const uploadFile = asyncHandler(

  async (req, res) => {

    const userId = req.user.userId;

    const file = req.file;

    const uploadedFile =
      await fileService.uploadFileService(
        file,
        userId
      );

    return res.status(201).json({

      success: true,

      message: "File uploaded successfully",

      file: uploadedFile
    });
  }
);


// ==========================
// GET USER FILES
// ==========================

export const getUserFiles =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      const files =
        await fileService.getUserFilesService(
          userId
        );

      return res.status(200).json({

        success: true,

        files
      });
    }
  );