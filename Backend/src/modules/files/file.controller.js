import asyncHandler from "../../utils/asyncHandler.js";

import * as fileService from "./file.service.js";


export const uploadFile = asyncHandler(

  async (req, res) => {

    // Check if file was provided
    if (!req.file) {
      const err = new Error("No file was provided. Please select a file to upload.");
      err.statusCode = 400;
      err.code = "NO_FILE_PROVIDED";
      throw err;
    }

    const userId = req.user.userId;
    const folderId = req.body.folderId || null;

    // Validate folderId format if provided
    if (folderId && typeof folderId !== "string") {
      const err = new Error("Invalid folder ID format.");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    const fileId = req.body.fileId || null;

    const uploadedFile =
      await fileService.uploadFileService(
        req.file,
        req.user.userId,
        folderId,
        fileId
      );

    return res.status(201).json({

      success: true,

      message: uploadedFile.message || "File uploaded successfully",

      file: uploadedFile.savedFile
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

export const moveToTrash = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await fileService.moveToTrashService(id, userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const restoreFromTrash = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await fileService.restoreFromTrashService(id, userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getTrashFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const files = await fileService.getTrashFilesService(userId);

  return res.status(200).json({
    success: true,
    files,
  });
});

export const emptyTrash = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await fileService.emptyTrashService(userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const toggleArchiveFile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await fileService.toggleArchiveFileService(id, userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const moveFile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { folderId } = req.body;

  const result = await fileService.moveFileService(id, folderId, userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getFileVersions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const versions = await fileService.getFileVersionsService(id, userId);
  return res.status(200).json({
    success: true,
    versions,
  });
});

export const restoreVersion = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id, versionId } = req.params;
  const result = await fileService.restoreVersionService(id, versionId, userId);
  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const deleteVersion = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id, versionId } = req.params;
  const result = await fileService.deleteVersionService(id, versionId, userId);
  return res.status(200).json({
    success: true,
    ...result,
  });
});