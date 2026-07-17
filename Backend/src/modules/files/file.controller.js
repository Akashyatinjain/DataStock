import asyncHandler from "../../utils/asyncHandler.js";
import * as fileService from "./file.service.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
const AdmZip = require("adm-zip");
import prisma from "../../config/db.js";
import { uploadOnCloudinary } from "../../services/cloudinary.js";
import { logActivity } from "../../utils/activityLogger.js";
import { extractText } from "../../utils/ocr.js";


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

export const bulkTrashFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid file list" });
  }

  const updateResult = await prisma.file.updateMany({
    where: { id: { in: fileIds }, ownerId: userId },
    data: { isTrash: true }
  });

  await logActivity(userId, `You moved ${fileIds.length} file(s) to Trash`);

  return res.status(200).json({ success: true, count: updateResult.count });
});

export const bulkStarFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileIds, isStarred } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid file list" });
  }

  const updateResult = await prisma.file.updateMany({
    where: { id: { in: fileIds }, ownerId: userId },
    data: { isStarred }
  });

  await logActivity(userId, `You ${isStarred ? 'starred' : 'unstarred'} ${fileIds.length} file(s)`);

  return res.status(200).json({ success: true, count: updateResult.count });
});

export const bulkMoveFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileIds, folderId } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid file list" });
  }

  const updateResult = await prisma.file.updateMany({
    where: { id: { in: fileIds }, ownerId: userId },
    data: { folderId: folderId || null }
  });

  let folderName = "My Drive";
  if (folderId) {
    const folderObj = await prisma.folder.findUnique({ where: { id: folderId } });
    if (folderObj) folderName = `Folder "${folderObj.name}"`;
  }

  await logActivity(userId, `You moved ${fileIds.length} file(s) to ${folderName}`);

  return res.status(200).json({ success: true, count: updateResult.count });
});

export const bulkDeleteFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid file list" });
  }

  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, ownerId: userId },
    include: { versions: true }
  });

  for (const file of files) {
    try {
      await fileService.deleteFileService(file.id, userId);
    } catch (err) {
      console.error(`Failed to delete file ${file.id} in bulk:`, err);
    }
  }

  await logActivity(userId, `You permanently deleted ${files.length} file(s)`);

  return res.status(200).json({ success: true, count: files.length });
});

const getMimetype = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimetypes = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimetypes[ext] || 'application/octet-stream';
};

export const compressFiles = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fileIds, folderIds, parentFolderId, zipName } = req.body;

  const targetZipName = (zipName || "Archive").replace(/\.zip$/i, "") + ".zip";
  const tempZipPath = `./temp_compress_${Date.now()}_${Math.random().toString(36).substring(7)}.zip`;

  const output = fs.createWriteStream(tempZipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  const archiveFinished = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
  });

  archive.pipe(output);

  const appendFileToArchive = async (file, relativePath) => {
    try {
      const response = await axios({
        url: file.url,
        method: 'GET',
        responseType: 'stream'
      });
      archive.append(response.data, { name: path.join(relativePath, file.originalName) });
    } catch (err) {
      console.error(`Error appending file ${file.id} to compress zip:`, err);
    }
  };

  const appendFolderToArchive = async (currentFolderId, relativePath) => {
    const files = await prisma.file.findMany({
      where: { folderId: currentFolderId, isTrash: false }
    });
    for (const file of files) {
      await appendFileToArchive(file, relativePath);
    }

    const subfolders = await prisma.folder.findMany({
      where: { parentId: currentFolderId }
    });
    for (const subfolder of subfolders) {
      await appendFolderToArchive(subfolder.id, path.join(relativePath, subfolder.name));
    }
  };

  try {
    if (Array.isArray(fileIds) && fileIds.length > 0) {
      const files = await prisma.file.findMany({
        where: { id: { in: fileIds }, ownerId: userId, isTrash: false }
      });
      for (const file of files) {
        await appendFileToArchive(file, "");
      }
    }

    if (Array.isArray(folderIds) && folderIds.length > 0) {
      const folders = await prisma.folder.findMany({
        where: { id: { in: folderIds }, ownerId: userId }
      });
      for (const folder of folders) {
        await appendFolderToArchive(folder.id, folder.name);
      }
    }

    await archive.finalize();
    await archiveFinished;

    const uploaded = await uploadOnCloudinary(tempZipPath);

    const savedFile = await prisma.file.create({
      data: {
        fileName: uploaded.public_id,
        originalName: targetZipName,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        mimeType: 'application/zip',
        size: uploaded.bytes,
        ownerId: userId,
        folderId: parentFolderId || null,
        versions: {
          create: {
            versionNumber: 1,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            size: uploaded.bytes
          }
        }
      },
      include: {
        versions: true
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: uploaded.bytes } }
    });

    await logActivity(userId, `You compressed ${[...(fileIds || []), ...(folderIds || [])].length} items into "${targetZipName}"`);

    return res.status(201).json({ success: true, file: savedFile });

  } catch (err) {
    console.error("ZIP Compression failed:", err);
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    return res.status(500).json({ success: false, message: "Failed to compress items to ZIP" });
  }
});

export const extractZip = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const zipFile = await prisma.file.findUnique({
    where: { id, ownerId: userId }
  });

  if (!zipFile) {
    return res.status(404).json({ success: false, message: "ZIP File not found" });
  }

  const currentFolderId = zipFile.folderId;
  const tempZipPath = `./temp_extract_${Date.now()}_${Math.random().toString(36).substring(7)}.zip`;

  try {
    const response = await axios({
      url: zipFile.url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempZipPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();

    const createdFoldersMap = {};

    const getOrCreateFolderForPath = async (relativePath, uId, baseFolderId) => {
      if (!relativePath) return baseFolderId;
      if (createdFoldersMap[relativePath]) return createdFoldersMap[relativePath];

      const parts = relativePath.split('/');
      let parentId = baseFolderId;
      let accumulatedPath = "";

      for (const part of parts) {
        if (!part) continue;
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;

        if (createdFoldersMap[accumulatedPath]) {
          parentId = createdFoldersMap[accumulatedPath];
          continue;
        }

        let dbFolder = await prisma.folder.findFirst({
          where: { name: part, parentId: parentId || null, ownerId: uId }
        });

        if (!dbFolder) {
          dbFolder = await prisma.folder.create({
            data: { name: part, parentId: parentId || null, ownerId: uId }
          });
        }

        createdFoldersMap[accumulatedPath] = dbFolder.id;
        parentId = dbFolder.id;
      }

      return parentId;
    };

    let extractedCount = 0;

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const fileDir = path.dirname(entry.entryName).replace(/\\/g, '/');
      const targetFolderId = await getOrCreateFolderForPath(
        fileDir === '.' ? "" : fileDir,
        userId,
        currentFolderId
      );

      const fileBuffer = entry.getData();
      const tempExtractedPath = `./temp_extracted_${Date.now()}_${path.basename(entry.entryName)}`;
      fs.writeFileSync(tempExtractedPath, fileBuffer);

      let ocrText = null;
      try {
        ocrText = await extractText(tempExtractedPath, getMimetype(entry.entryName));
      } catch (ocrErr) {
        console.error("OCR Extraction failed for extracted file:", ocrErr);
      }

      const uploaded = await uploadOnCloudinary(tempExtractedPath);

      await prisma.file.create({
        data: {
          fileName: uploaded.public_id,
          originalName: path.basename(entry.entryName),
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          mimeType: getMimetype(entry.entryName),
          size: uploaded.bytes,
          ownerId: userId,
          folderId: targetFolderId || null,
          ocrText: ocrText,
          versions: {
            create: {
              versionNumber: 1,
              url: uploaded.secure_url,
              publicId: uploaded.public_id,
              size: uploaded.bytes
            }
          }
        }
      });

      await prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: uploaded.bytes } }
      });

      extractedCount++;
    }

    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    await logActivity(userId, `You extracted ZIP archive "${zipFile.originalName}" (${extractedCount} files unpacked)`);

    return res.status(200).json({ success: true, extractedCount });

  } catch (err) {
    console.error("ZIP Extraction failed:", err);
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    return res.status(500).json({ success: false, message: "Failed to extract ZIP archive" });
  }
});