import prisma from "../config/db.js";

/**
 * Checks folder access for a user recursively.
 * Walks up the parent folders to check if the user is the owner or has shared access.
 * Returns { permission: "VIEW" | "EDIT", role: "OWNER" | "COLLABORATOR" } or null if no access.
 * 
 * @param {string} folderId 
 * @param {string} userId 
 * @returns {Promise<{permission: string, role: string} | null>}
 */
export const checkFolderAccess = async (folderId, userId) => {
  if (!folderId) return null;

  let currentFolderId = folderId;
  const visited = new Set();

  while (currentFolderId) {
    if (visited.has(currentFolderId)) break;
    visited.add(currentFolderId);

    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      include: {
        sharedWith: {
          where: { sharedToId: userId }
        }
      }
    });

    if (!folder) return null;

    // Owner gets full EDIT permission
    if (folder.ownerId === userId) {
      return { permission: "EDIT", role: "OWNER" };
    }

    // Direct share on this specific folder
    if (folder.sharedWith.length > 0) {
      return {
        permission: folder.sharedWith[0].permission,
        role: "COLLABORATOR"
      };
    }

    // Move up parent hierarchy
    currentFolderId = folder.parentId;
  }

  return null;
};

/**
 * Checks file access for a user.
 * Checks direct file owner, direct file share, or inherited folder permission.
 * Returns { permission: "VIEW" | "EDIT", role: "OWNER" | "COLLABORATOR" } or null if no access.
 * 
 * @param {string} fileId 
 * @param {string} userId 
 * @returns {Promise<{permission: string, role: string} | null>}
 */
export const checkFileAccess = async (fileId, userId) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId }
  });

  if (!file) return null;

  // Owner gets full EDIT permission
  if (file.ownerId === userId) {
    return { permission: "EDIT", role: "OWNER" };
  }

  // Direct share on this specific file
  const fileShare = await prisma.fileShare.findUnique({
    where: {
      fileId_sharedToId: { fileId, sharedToId: userId }
    }
  });

  if (fileShare) {
    return { permission: fileShare.permission, role: "COLLABORATOR" };
  }

  // Inherited share from containing folder
  if (file.folderId) {
    return await checkFolderAccess(file.folderId, userId);
  }

  return null;
};
