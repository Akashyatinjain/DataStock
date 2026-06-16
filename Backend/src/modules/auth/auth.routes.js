import express from "express";
import {
  signInUser,
  signUpUser,
  logoutUser,
  sendOTPController,
  verifyOTPController,
  getSession,
  refreshSession,
} from "./auth.controller.js";
import {
  signUpvalidation,
  loginValidation,
  otpSendValidation,
  otpVerifyValidation,
  validate,
} from "./auth.validation.js";
import passport from "./providers/googleAuth.js";
import * as authService from "./auth.service.js";
import { issueAuthSession } from "../../utils/authSession.utils.js";
import {
  loginLimiter,
  signupLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  refreshLimiter,
} from "../../middleware/authRateLimit.js";

const router = express.Router();

const frontendUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173";

router.post("/login", loginLimiter, loginValidation, validate, signInUser);
router.post("/signup", signupLimiter, signUpvalidation, validate, signUpUser);
router.post("/logout", logoutUser);
router.get("/session", getSession);
router.post("/refresh", refreshLimiter, refreshSession);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, googleUser) => {
    const loginUrl = `${frontendUrl()}/login`;

    if (err || !googleUser) {
      console.error("Google OAuth error:", err?.message || "No user returned");
      return res.redirect(`${loginUrl}?error=google_auth_failed`);
    }

    try {
      const user = await authService.googleLogin(googleUser);
      const session = await issueAuthSession(user, res);
      // Cross-origin SPAs cannot rely on third-party cookies (Vercel → Render).
      // Pass tokens in the URL hash (never sent to the server) for the frontend to store.
      const hash = new URLSearchParams({
        at: session.token,
        rt: session.refreshToken,
      }).toString();
      return res.redirect(`${frontendUrl()}/dashboard?auth=google#${hash}`);
    } catch (error) {
      console.error("Google login error:", error.message);
      const message = encodeURIComponent(error.message || "Google sign-in failed");
      return res.redirect(`${loginUrl}?error=${message}`);
    }
  })(req, res, next);
});

router.post(
  "/send-otp",
  otpSendLimiter,
  otpSendValidation,
  validate,
  sendOTPController
);
router.post(
  "/verify-otp",
  otpVerifyLimiter,
  otpVerifyValidation,
  validate,
  verifyOTPController
);

export default router;
