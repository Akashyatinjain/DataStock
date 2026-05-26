import prisma from "../../config/db.js";


// ==========================
// CREATE FOLDER
// ==========================

export const createFolder =
  async (data) => {

    return await prisma.folder.create({
      data
    });
};


// ==========================
// GET USER FOLDERS
// ==========================

export const getFoldersByUserId =
  async (userId) => {

    return await prisma.folder.findMany({

      where: {
        ownerId: userId
      },

      orderBy: {
        createdAt: "desc"
      }
    });
};


// ==========================
// FIND FOLDER BY ID
// ==========================

export const findFolderById =
  async (folderId) => {

    return await prisma.folder.findUnique({

      where: {
        id: folderId
      },

      include: {
        files: true,
        children: true
      }
    });
};


// ==========================
// DELETE FOLDER BY ID
// ==========================

export const deleteFolderById =
  async (folderId) => {

    return await prisma.folder.delete({

      where: {
        id: folderId
      }
    });
};

