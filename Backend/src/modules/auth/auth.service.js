import { createUser, findUserByEmail } from "./auth.repository.js";
import { hashPassword, comparePassword } from "./providers/passwordAuth.js";
import { sendOTP, verifyOTP } from "./providers/otpAuth.js";
import * as authRepo from "./auth.repository.js";
import {
  issueAuthSession,
  sanitizeUser,
} from "../../utils/authSession.utils.js";

/* =========================
   SIGNUP LOCAL
========================= */
export const signUpUserLocal = async ({ username, email, password }, res) => {
  if (!username || !email || !password) {
    throw new Error("Username, email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existUser = await findUserByEmail(normalizedEmail);
  if (existUser) {
    const err = new Error("Email already exists");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    username: username.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    authProvider: "local",
  });

  return issueAuthSession(user, res);
};

/* =========================
   SIGNIN LOCAL
========================= */
export const signInUserLocal = async ({ email, password }, res) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (user.authProvider !== "local") {
    const err = new Error("Use original login method");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const sessionUser = await authRepo.findUserSessionById(user.id);
  return issueAuthSession(sessionUser, res);
};

/* =========================
   GOOGLE LOGIN
========================= */
export const googleLogin = async (googleUser) => {
  const { email, name, googleId } = googleUser;

  if (!email) {
    throw new Error("Google account did not provide an email");
  }

  if (!googleId) {
    throw new Error("Google account ID missing");
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user = await authRepo.findUserByEmail(normalizedEmail);

  if (user) {
    if (user.authProvider === "google") {
      return authRepo.findUserSessionById(user.id);
    }

    const err = new Error(
      "An account with this email already exists. Sign in with your password first."
    );
    err.statusCode = 409;
    throw err;
  }

  const existingGoogleUser = await authRepo.findUserByGoogleId(googleId);
  if (existingGoogleUser) {
    return authRepo.findUserSessionById(existingGoogleUser.id);
  }

  return authRepo.createGoogleUser({
    email: normalizedEmail,
    username: name?.trim() || normalizedEmail.split("@")[0],
    googleId,
  });
};

/* =========================
   OTP SERVICES
========================= */

export const requestOTPService = async (email) => {
  if (!email) throw new Error("Email is required");
  return await sendOTP(email);
};

export const verifyOTPService = async (email, otp, res) => {
  if (!email || !otp) throw new Error("Email and OTP required");

  const normalizedEmail = email.toLowerCase().trim();
  await verifyOTP(normalizedEmail, otp);

  let user = await findUserByEmail(normalizedEmail);

  if (!user) {
    user = await createUser({
      username: normalizedEmail.split("@")[0],
      email: normalizedEmail,
      authProvider: "otp",
    });
  } else if (user.authProvider === "local") {
    const err = new Error("This email uses password login. Sign in with your password.");
    err.statusCode = 409;
    throw err;
  } else {
    user = await authRepo.findUserSessionById(user.id);
  }

  return issueAuthSession(user, res);
};
