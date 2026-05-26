import asyncHandler from "../../utils/asyncHandler.js";

import * as folderService
from "./folder.service.js";


export const createFolder =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      const {
        name,
        parentId
      } = req.body;

      const folder =
        await folderService.createFolderService(

          name,

          userId,

          parentId
        );

      return res.status(201).json({

        success: true,

        message:
          "Folder created successfully",

        folder
      });
    }
  );


export const getFolders =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      const folders =
        await folderService.getFoldersService(
          userId
        );

      return res.status(200).json({

        success: true,

        folders
      });
    }
  );

  export const deleteFolder =
  asyncHandler(

    async (req, res) => {

      const userId =
        req.user.userId;

      const { id } =
        req.params;

      const result =
        await folderService.deleteFolderService(

          id,

          userId
        );

      return res.status(200).json({

        success: true,

        ...result
      });
    }
  );