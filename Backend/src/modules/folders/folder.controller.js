import asyncHandler from "../../utils/asyncHandler.js";
import * as folderService from "./folder.service.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
import axios from "axios";
import path from "path";
import prisma from "../../config/db.js";
import { checkFolderAccess } from "../../utils/permission.js";


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

export const downloadFolder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const folderId = req.params.id;

  const hasAccess = await checkFolderAccess(folderId, userId);
  if (!hasAccess) {
    return res.status(403).json({ message: "Unauthorized: You do not have permission for this folder" });
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId }
  });

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on('error', (err) => {
    console.error('[Archive Error]', err);
    throw err;
  });

  archive.pipe(res);

  const addFolderToArchive = async (currentFolderId, relativePath) => {
    const files = await prisma.file.findMany({
      where: { folderId: currentFolderId, isTrash: false, isArchived: false }
    });

    for (const file of files) {
      try {
        const response = await axios({
          url: file.url,
          method: 'GET',
          responseType: 'stream'
        });
        archive.append(response.data, { name: path.join(relativePath, file.originalName) });
      } catch (err) {
        console.error(`[Archive] Failed to fetch stream for file "${file.originalName}" (${file.id}):`, err);
      }
    }

    const subfolders = await prisma.folder.findMany({
      where: { parentId: currentFolderId }
    });

    for (const subfolder of subfolders) {
      await addFolderToArchive(subfolder.id, path.join(relativePath, subfolder.name));
    }
  };

  try {
    await addFolderToArchive(folderId, "");
    await archive.finalize();
  } catch (err) {
    console.error("ZIP Finalization failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to download folder archive" });
    }
  }
});