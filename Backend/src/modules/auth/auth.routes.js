import express from "express"
import { signInUser, signUpUser,logoutUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
import passport from "./providers/googleAuth.js";
import {

  sendOTPController,
  verifyOTPController
} from "./auth.controller.js";
import * as authService from "./auth.service.js";
import { createToken } from "../../utils/token.utils.js";

const router = express.Router();

const frontendUrl =
  () =>
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173";

router.post("/login",loginValidation,signInUser);
router.post("/signup",signUpvalidation,signUpUser);
router.post("/logout", logoutUser);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, googleUser) => {
    const loginUrl = `${frontendUrl()}/login`;
 console.log("=== PASSPORT ERR:", JSON.stringify(err));
    console.log("=== GOOGLE USER:", JSON.stringify(googleUser));
    if (err || !googleUser) {
      console.error("Google OAuth error:", err);
      return res.redirect(`${loginUrl}?error=google_auth_failed`);
    }

    try {
      const user = await authService.googleLogin(googleUser);
      const token = createToken(user);
      return res.redirect(`${frontendUrl()}/dashboard?token=${token}`);
    } catch (error) {
      console.error("Google login error:", error);
      const message = encodeURIComponent(
        error.message || "Google sign-in failed"
      );
      return res.redirect(`${loginUrl}?error=${message}`);
    }
  })(req, res, next);
});

router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);


export default router;