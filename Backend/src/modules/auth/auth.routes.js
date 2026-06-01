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

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl()}/login`,
  }),
  async (req, res, next) => {
    try {
      const user = await authService.googleLogin(req.user);
      const token = createToken(user);
      res.redirect(`${frontendUrl()}/dashboard?token=${token}`);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);


export default router;