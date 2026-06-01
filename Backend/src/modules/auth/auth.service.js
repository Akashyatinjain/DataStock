import { createUser, findUserByEmail } from "./auth.repository.js";
import { hashPassword, comparePassword } from "./providers/passwordAuth.js";
import { createToken } from "../../utils/token.utils.js";
import { setAuthCookie } from "../../utils/cookie.utils.js";
import { sendOTP, verifyOTP } from "./providers/otpAuth.js";
import * as authRepo from "./auth.repository.js";

/* =========================
   SIGNUP LOCAL
========================= */
export const signUpUserLocal = async ({ username, email, password }, res) => {
  try {
    if (!username || !email || !password) {
      throw new Error("Username, email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // check existing user
    const existUser = await findUserByEmail(normalizedEmail);
    if (existUser) {
  const err = new Error("Email already exists");
  err.statusCode = 400;
  throw err;
}

    // hash password
    const hashedPassword = await hashPassword(password);

    // create user
    const user = await createUser({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local"
    });

    // create token
    const token = createToken(user);

    // set cookie
    setAuthCookie(res, token);

    const { password: _, ...safeUser } = user;

    return {
      message: "User created successfully",
      user: safeUser,
      token,
      success: true
    };

  } catch (error) {
    throw error;
  }
};


/* =========================
   SIGNIN LOCAL
========================= */
export const signInUserLocal = async ({ email, password }, res) => {
  try {

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.authProvider !== "local") {
      throw new Error("Use original login method");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = createToken(user);
    setAuthCookie(res, token);

    const { password: _, ...safeUser } = user;

    return {
      message: "Signed in successfully",
      user: safeUser,
      token
    };

  } catch (error) {
    throw error;
  }
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
      return user;
    }

    // Same email signed up with password/OTP — link Google instead of failing
    return authRepo.linkGoogleToUser(user.id, { googleId });
  }

  const existingGoogleUser = await authRepo.findUserByGoogleId(googleId);
  if (existingGoogleUser) {
    return existingGoogleUser;
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

export const verifyOTPService = async (email, otp) => {
  if (!email || !otp) throw new Error("Email and OTP required");
  return await verifyOTP(email, otp);
};
