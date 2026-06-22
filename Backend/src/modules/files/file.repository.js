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

export const deleteFileService = async (fileId, userId) => {
  const file = await findFileById(fileId);  
  if (!file) {
    throw new Error("File not found");
  }   
  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to delete this file");
  } 
  await deleteFileById(fileId);
  if (file.folderId) {
    await prisma.folder.update({
      where: { id: file.folderId },
      data: {
        fileCount: {
          decrement: 1
        }
      }
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {    
          decrement: file.size
        }
      }
    });
  }
  await createNotificationService(
    userId,
    `File "${file.originalName}" deleted successfully`
  );
  return {
    message: `File "${file.originalName}" deleted successfully` 
  };
};

export const deletePermanent = async (fileId, userId) => {
  const file = await findFileById(fileId);  
  if (!file) {
    throw new Error("File not found");
  } 
  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to delete this file");
  }   
  if (!file.isTrash) {
    throw new Error("File must be in trash to delete permanently");
  } 

  // delete from storage
  await deleteFileFromStorage(file.path);
  // delete from database
  await deleteFileById(fileId);
  return {
    message: `File "${file.originalName}" deleted permanently`
  };
};

export const moveToTrash = async (fileId, userId) => {    
  const file = await findFileById(fileId);
  if (!file) {
    throw new Error("File not found");
  }         

  if (file.ownerId !== userId) {
    throw new Error("Unauthorized to move this file to trash");
  } 
  if (file.isTrash) {
    throw new Error("File is already in trash");
  }
  await prisma.file.update({
    where: {
      id: fileId
    },
    data: {
      isTrash: true
    }
  });
  return {
    message: `File "${file.originalName}" moved to trash`
  };
};

