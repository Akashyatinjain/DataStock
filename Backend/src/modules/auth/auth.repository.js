import prisma from "../../config/db.js";

const userSessionSelect = {
  id: true,
  username: true,
  email: true,
  authProvider: true,
  tokenVersion: true,
  refreshTokenHash: true,
  refreshTokenExpiresAt: true,
  storageUsed: true,
  storageLimit: true,
  subscriptionPlan: true,
  subscriptionId: true,
  imageUrl: true,
  createdAt: true,
};

export const createUser = (data) => {
  return prisma.user.create({
    data,
    select: userSessionSelect,
  });
};

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserByGoogleId = (googleId) => {
  return prisma.user.findUnique({
    where: { googleId },
  });
};

export const findUserSessionById = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSessionSelect,
  });
};

export const findUserByRefreshTokenHash = (refreshTokenHash) => {
  return prisma.user.findFirst({
    where: {
      refreshTokenHash,
      refreshTokenExpiresAt: {
        gt: new Date(),
      },
    },
    select: userSessionSelect,
  });
};

export const saveRefreshToken = (userId, refreshTokenHash, refreshTokenExpiresAt) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt,
    },
    select: userSessionSelect,
  });
};

export const revokeUserSessions = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      tokenVersion: {
        increment: 1,
      },
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });
};

export const createGoogleUser = ({ email, username, googleId }) => {
  return prisma.user.create({
    data: {
      email,
      username,
      googleId,
      authProvider: "google",
    },
    select: userSessionSelect,
  });
};

export const linkGoogleToUser = (userId, { googleId }) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      googleId,
      authProvider: "google",
    },
    select: userSessionSelect,
  });
};

export const deleteExistingOTP = async (email) => {
  return prisma.emailOTP.deleteMany({
    where: { email },
  });
};

export const createOTP = async (email, otp, expiresAt) => {
  return prisma.emailOTP.create({
    data: {
      email,
      otp,
      expiresAt,
      attempts: 0,
    },
  });
};

export const findValidOTP = async (email) => {
  return prisma.emailOTP.findFirst({
    where: {
      email,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

export const incrementOTPAttempts = async (id, attempts) => {
  return prisma.emailOTP.update({
    where: { id },
    data: {
      attempts,
    },
  });
};

export const deleteOTP = async (email) => {
  return prisma.emailOTP.deleteMany({
    where: { email },
  });
};
