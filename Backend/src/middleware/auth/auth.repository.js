import prisma from "../../config/db.js";

export const createUser = (data) =>{
    return prisma.user.create({
      data: data,   // ✅ use incoming object
      select: {
        id: true,
        username: true,
        email: true,
        authProvider: true
      }
    });
} 

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email }
  });
};

export const findUserByGoogleId = (googleId) => {
  return prisma.user.findUnique({
    where: { googleId }
  });
};

export const createGoogleUser = ({ email, username, googleId }) => {
  return prisma.user.create({
    data: {
      email,
      username,
      googleId,
      authProvider: "google"
    },
    select: {
      id: true,
      username: true,
      email: true,
      authProvider: true
    }
  });
};