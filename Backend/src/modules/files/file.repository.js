import prisma from "../../config/db.js";

// create File 
export const createFile = async (data) =>{
    return prisma.file.create({
        data,
        include :{
            owner:{
                select :{
                    id:true,
                    username:true,
                    email:true
                }
            }
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

        isTrash: false
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
    }
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
    orderBy: {
      updatedAt: "desc",
    },
  });
};