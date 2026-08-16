import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { extractText } from "../../utils/ocr.js";
import { invalidateUserFilesCache } from "../../services/cache.service.js";
import { getIO } from "../../socket.js";
import { getRedisConnectionOptions } from "../queue.config.js";

const prisma = new PrismaClient();

/**
 * Core OCR worker processing function
 * Can be executed by BullMQ worker OR directly by fail-safe fallback
 */
export const processOcrTask = async (data) => {
  const { fileId, filePath, fileUrl, mimetype, userId } = data;
  if (!fileId) return null;

  console.log(`🔍 [OCR Worker] Processing OCR text extraction for File ID ${fileId} (${mimetype || "unknown type"})`);

  let tempPathToClean = null;
  let effectivePath = filePath;

  try {
    // If local temp file no longer exists (e.g. removed after upload), download from Cloudinary to temp dir
    if (!effectivePath || !fs.existsSync(effectivePath)) {
      if (fileUrl) {
        console.log(`⬇️ [OCR Worker] Downloading file from Cloudinary for OCR analysis...`);
        const response = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 20000 });
        const ext = path.extname(fileUrl.split("?")[0]) || (mimetype?.includes("pdf") ? ".pdf" : ".jpg");
        const tempName = `ocr_${fileId}_${Date.now()}${ext}`;
        tempPathToClean = path.join(os.tmpdir(), tempName);
        fs.writeFileSync(tempPathToClean, Buffer.from(response.data));
        effectivePath = tempPathToClean;
      } else {
        console.warn(`⚠️ [OCR Worker] No valid path or URL available for File ID ${fileId}`);
        return null;
      }
    }

    // Run OCR text extraction
    const ocrText = await extractText(effectivePath, mimetype);

    if (ocrText && ocrText.trim().length > 0) {
      console.log(`✅ [OCR Worker] OCR extracted ${ocrText.length} characters for File ID ${fileId}`);

      // Update database with indexed OCR text
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: { ocrText: ocrText.trim() },
        select: { id: true, originalName: true, ocrText: true, ownerId: true },
      });

      // Invalidate user files cache so search and file lists include fresh OCR metadata
      const targetUserId = userId || updatedFile.ownerId;
      if (targetUserId) {
        await invalidateUserFilesCache(targetUserId);
      }

      // Broadcast real-time OCR completion to connected clients via Socket.io
      try {
        const io = getIO();
        if (io) {
          if (targetUserId) {
            io.to(targetUserId).emit("file_ocr_completed", {
              fileId,
              ocrText: updatedFile.ocrText,
            });
          }
          io.to(`file:${String(fileId)}`).emit("file_ocr_completed", {
            fileId,
            ocrText: updatedFile.ocrText,
          });
        }
      } catch (socketErr) {
        // Socket broadcast error is non-critical
      }

      return updatedFile;
    } else {
      console.log(`ℹ️ [OCR Worker] No textual content detected in File ID ${fileId}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ [OCR Worker] OCR text extraction failed for File ID ${fileId}:`, err.message);
    throw err;
  } finally {
    // Cleanup any temporary downloaded file
    if (tempPathToClean && fs.existsSync(tempPathToClean)) {
      try {
        fs.unlinkSync(tempPathToClean);
      } catch (cleanupErr) {
        // Ignored
      }
    }
  }
};

let ocrWorker = null;

export const initOcrWorker = () => {
  if (ocrWorker) return ocrWorker;

  try {
    ocrWorker = new Worker(
      "datastock_ocr_queue",
      async (job) => {
        return await processOcrTask(job.data);
      },
      {
        connection: getRedisConnectionOptions(),
        concurrency: 2, // Process up to 2 OCR jobs concurrently to avoid high CPU spikes
      }
    );

    ocrWorker.on("completed", (job) => {
      console.log(`✨ [OCR Worker] Job #${job.id} completed successfully for File ID ${job.data.fileId}`);
    });

    ocrWorker.on("failed", (job, err) => {
      console.warn(`⚠️ [OCR Worker] Job #${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
    });

    let lastWorkerErrorLog = 0;
    ocrWorker.on("error", (err) => {
      const now = Date.now();
      if (now - lastWorkerErrorLog > 60000) {
        lastWorkerErrorLog = now;
        console.warn("⚠️ BullMQ OCR Worker notice (fallback mode active):", err.message);
      }
    });

    console.log("👷 [Workers] BullMQ OCR Worker initialized and listening");
  } catch (err) {
    console.warn("⚠️ Could not start BullMQ OCR Worker:", err.message);
    ocrWorker = null;
  }

  return ocrWorker;
};

export const closeOcrWorker = async () => {
  if (ocrWorker) {
    try {
      await ocrWorker.close();
    } catch (err) {
      // Ignored
    }
    ocrWorker = null;
  }
};
