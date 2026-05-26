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

export const getFilesByUserId = async (userId) => {

  return prisma.file.findMany({

    where: {
      ownerId: userId,
      isTrash: false
    },

    orderBy: {
      createdAt: "desc"
    }
  });
};