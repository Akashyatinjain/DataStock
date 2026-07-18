import prisma from "../../config/db.js";

// create File 
export const createFile = async (data) =>{
    return prisma.file.create({
        data: {
            ...data,
            versions: {
                create: {
                    versionNumber: 1,
                    url: data.url,
                    publicId: data.publicId,
                    size: data.size,
                    isEncrypted: data.isEncrypted || false,
                    encryptedKey: data.encryptedKey || null,
                    fileIv: data.fileIv || null,
                }
            }
        },
        include :{
            owner:{
                select :{
                    id:true,
                    username:true,
                    email:true
                }
            },
            versions: true
        }
    });
};

// export const getUserFiles = async (userId) =>{
//     return prisma.file.findMany({
//         where :{
//             ownerId : userId,
//             isTrash : false 
//         },
//         orderBy:{
//             createdAt:"desc"
//         }
//     });
// };

// export const getFilesByUserId = async (userId) => {

//   return prisma.file.findMany({

//     // where: {
//     //   ownerId: userId,
//     //   isTrash: false
//     // },
//     where: {

//   ownerId: userId,
//  isTrash: false,

//   folderId:
//     folderId || null
// },

//     orderBy: {
//       createdAt: "desc"
//     }
//   });
// };

export const getFilesByUserId =
  async (
    userId,
    folderId = null
  ) => {

    return await prisma.file.findMany({

      where: {

        ownerId: userId,

        folderId:
          folderId || null,

        isTrash: false,
        isArchived: false
      },

      orderBy: {
        createdAt: "desc"
      }
    });
};

export const getAllFilesByUserId = async (userId) => {
  return prisma.file.findMany({
    where: {
      ownerId: userId,
      isTrash: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findFileById = async (fileId) => {
  return prisma.file.findUnique({
    where: {
      id: fileId
    },
    include: {
      versions: true
    }
  });
};

export const getFileVersionsByFileId = async (fileId) => {
  return prisma.fileVersion.findMany({
    where: { fileId },
    orderBy: { versionNumber: "desc" },
  });
};

export const findVersionById = async (versionId) => {
  return prisma.fileVersion.findUnique({
    where: { id: versionId },
  });
};

export const deleteVersionById = async (versionId) => {
  return prisma.fileVersion.delete({
    where: { id: versionId },
  });
};

export const findFileVersionCount = async (fileId) => {
  return prisma.fileVersion.count({
    where: { fileId },
  });
};


export const deleteFileById = async (fileId) => {

  return prisma.file.delete({
    where: {
      id: fileId
    }
  });
};

export const updateFileStarred = async (fileId, isStarred) => {
  return prisma.file.update({
    where: { id: fileId },
    data: { isStarred },
  });
};

export const deleteFilesByFolderId = async (folderId) => {
  return await prisma.file.deleteMany({
    where: {
      folderId: folderId
    }
  });
};

export const moveFileToTrash = async (fileId) => {
  return prisma.file.update({
    where: { id: fileId },
    data: { isTrash: true },
  });
};

export const restoreFileFromTrash = async (fileId) => {
  return prisma.file.update({
    where: { id: fileId },
    data: { isTrash: false },
  });
};

export const getTrashFilesByUserId = async (userId) => {
  return prisma.file.findMany({
    where: {
      ownerId: userId,
      isTrash: true,
    },
    include: {
      versions: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const updateFileArchived = async (fileId, isArchived) => {
  return prisma.file.update({
    where: { id: fileId },
    data: { isArchived },
  });
};

export const updateFileFolder = async (fileId, folderId) => {
  return prisma.file.update({
    where: { id: fileId },
    data: { folderId },
  });
};