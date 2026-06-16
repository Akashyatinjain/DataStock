import crypto from "crypto";
import {
  createAccessToken,
  verifyAccessToken,
} from "./token.utils.js";
import {
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from "./cookie.utils.js";
import * as authRepo from "../modules/auth/auth.repository.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const createRefreshToken = () => crypto.randomBytes(64).toString("hex");

export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, refreshTokenHash, refreshTokenExpiresAt, ...safeUser } = user;
  return safeUser;
};

export const extractAuthToken = (req) => {
  // Prefer the Authorization header so SPA localStorage tokens win over
  // stale httpOnly cookies left from an older session.
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

export const validateAccessPayload = async (decoded) => {
  if (decoded.type && decoded.type !== "access") {
    return null;
  }

  const user = await authRepo.findUserSessionById(decoded.userId);
  if (!user) {
    return null;
  }

  if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
    return null;
  }

  return user;
};

export const issueAuthSession = async (user, res) => {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const sessionUser = await authRepo.saveRefreshToken(
    user.id,
    refreshTokenHash,
    refreshTokenExpiresAt
  );

  const accessToken = createAccessToken(sessionUser);
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);

  return {
    message: "Authenticated successfully",
    token: accessToken,
    refreshToken,
    user: sanitizeUser(sessionUser),
    success: true,
  };
};

export const refreshAuthSession = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    const error = new Error("Refresh token missing");
    error.statusCode = 401;
    throw error;
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const user = await authRepo.findUserByRefreshTokenHash(refreshTokenHash);

  if (
    !user ||
    !user.refreshTokenExpiresAt ||
    user.refreshTokenExpiresAt <= new Date()
  ) {
    clearAuthCookies(res);
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  return issueAuthSession(user, res);
};

export const revokeAuthSession = async (req, res) => {
  const token = extractAuthToken(req);

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      await authRepo.revokeUserSessions(decoded.userId);
    } catch {
      // Still clear cookies even if the access token is invalid/expired.
    }
  }

  clearAuthCookies(res);
};

export const getSessionFromRequest = async (req, res) => {
  const token = extractAuthToken(req);

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await validateAccessPayload(decoded);

      if (user) {
        return {
          token,
          user: sanitizeUser(user),
        };
      }
    } catch {
      // Fall through to refresh-token recovery.
    }
  }

  const refreshed = await refreshAuthSession(req, res);
  return {
    token: refreshed.token,
    user: refreshed.user,
  };
};
