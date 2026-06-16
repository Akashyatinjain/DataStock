import asyncHandler from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";
import {
  getSessionFromRequest,
  refreshAuthSession,
  revokeAuthSession,
} from "../../utils/authSession.utils.js";

export const signUpUser = asyncHandler(async (req, res) => {
  const result = await authService.signUpUserLocal(req.body, res);
  return res.status(201).json(result);
});

export const signInUser = asyncHandler(async (req, res) => {
  const result = await authService.signInUserLocal(req.body, res);
  return res.status(200).json(result);
});

export const logoutUser = asyncHandler(async (req, res) => {
  await revokeAuthSession(req, res);

  res.status(200).json({
    message: "Logout successful",
  });
});

export const getSession = asyncHandler(async (req, res) => {
  try {
    const session = await getSessionFromRequest(req, res);
    return res.status(200).json({
      success: true,
      ...session,
    });
  } catch (error) {
    if (error?.statusCode === 401) {
      return res.status(200).json({
        success: false,
        token: null,
        user: null,
      });
    }

    throw error;
  }
});

export const refreshSession = asyncHandler(async (req, res) => {
  const session = await refreshAuthSession(req, res);
  return res.status(200).json({
    success: true,
    ...session,
  });
});

export const sendOTPController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.requestOTPService(email);
  res.json(result);
});

export const verifyOTPController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOTPService(email, otp, res);
  res.json(result);
});
