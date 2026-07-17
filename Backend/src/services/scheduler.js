import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { deleteFromCloudinary } from './cloudinary.js';
import * as fileRepo from '../modules/files/file.repository.js';

const prisma = new PrismaClient();

/**
 * Permanently deletes a single file from Cloudinary and PostgreSQL.
 * Reclaims the storage quota for the file owner.
 */
export const purgeFilePermanently = async (file) => {
  const fileId = file.id;
  const userId = file.ownerId;
  const versions = file.versions || [];
  
  const uniquePublicIds = [...new Set([
    file.publicId,
    ...versions.map(v => v.publicId)
  ].filter(Boolean))];

  for (const pid of uniquePublicIds) {
    // Count other references to this Cloudinary asset across files/versions
    const referencedElsewhere = await prisma.fileVersion.count({
      where: {
        publicId: pid,
        fileId: { not: fileId }
      }
    }) + await prisma.file.count({
      where: {
        publicId: pid,
        id: { not: fileId }
      }
    });

    if (referencedElsewhere === 0) {
      try {
        await deleteFromCloudinary(
          pid,
          file.mimeType?.startsWith("video") ? "video" : "image"
        );
      } catch (err) {
        console.error(`[Scheduler] Failed to delete Cloudinary asset ${pid}:`, err);
      }
    }
  }

  // Delete from DB (Cascade delete removes versions)
  await fileRepo.deleteFileById(fileId);

  // Reclaim storage quota
  const totalSize = versions.length > 0
    ? versions.reduce((sum, v) => sum + v.size, 0)
    : file.size;

  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: {
        decrement: totalSize
      }
    }
  });
};

/**
 * Scheduled job to run at midnight daily and purge files moved to trash > 30 days ago.
 */
export const startScheduler = () => {
  // Midnight Cron Pattern: 0 0 * * *
  // Daily cleanup task
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Starting automated trash cleanup job...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find all files that are in Trash and were last updated (i.e. moved to trash) > 30 days ago
      const filesToPurge = await prisma.file.findMany({
        where: {
          isTrash: true,
          updatedAt: {
            lt: thirtyDaysAgo
          }
        },
        include: {
          versions: true
        }
      });

      console.log(`[Scheduler] Found ${filesToPurge.length} files to permanently delete.`);

      for (const file of filesToPurge) {
        try {
          await purgeFilePermanently(file);
          await prisma.activity.create({
            data: {
              userId: file.ownerId,
              message: `System auto-purged "${file.originalName}" from Trash (older than 30 days)`
            }
          });
          console.log(`[Scheduler] Successfully purged file: ${file.originalName} (${file.id})`);
        } catch (fileErr) {
          console.error(`[Scheduler] Error purging file ${file.id}:`, fileErr);
        }
      }

      console.log('[Scheduler] Automated trash cleanup job finished.');
    } catch (error) {
      console.error('[Scheduler] Error running trash cleanup job:', error);
    }
  });

  console.log('[Scheduler] Midnight trash cleanup task scheduled successfully.');
};
