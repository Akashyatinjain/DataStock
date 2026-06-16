import jwt from "jsonwebtoken";
import {
  extractAuthToken,
  validateAccessPayload,
} from "../utils/authSession.utils.js";
import { verifyAccessToken } from "../utils/token.utils.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const token = extractAuthToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing",
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await validateAccessPayload(decoded);

    if (!user) {
      return res.status(401).json({
        message: "Session expired or revoked",
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const optionalAuthenticateUser = async (req, res, next) => {
  try {
    const token = extractAuthToken(req);
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await validateAccessPayload(decoded);

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth.
  }

  next();
};
