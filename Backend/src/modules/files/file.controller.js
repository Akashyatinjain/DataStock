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




export const uploadFile = asyncHandler(

  async (req, res) => {

    const userId = req.user.userId;
    const folderId =
  req.body.folderId || null;
  
    const file = req.file;

    const uploadedFile =
      await fileService.uploadFileService(
  req.file,

  req.user.userId,

  folderId
);

    return res.status(201).json({

      success: true,

      message: "File uploaded successfully",

      file: uploadedFile
    });
  }
);



export const getUserFiles =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      if (req.query.all === "true") {
        const files =
          await fileService.getAllUserFilesService(userId);

        return res.status(200).json({
          success: true,
          files,
        });
      }

      const folderId =
        req.query.folderId || null;

      const files =
        await fileService.getUserFilesService(

          userId,

          folderId
        );

      return res.status(200).json({

        success: true,

        files
      });
    }
  );


  export const deleteFile =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      const { id } = req.params;

      const result =
        await fileService.deleteFileService(
          id,
          userId
        );

      return res.status(200).json({

        success: true,

        ...result
      });
    }
  );

export const toggleStarFile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await fileService.toggleStarFileService(id, userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});