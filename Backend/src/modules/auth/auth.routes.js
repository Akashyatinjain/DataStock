import express from "express"
import { signInUser, signUpUser,logoutUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
import passport from "./providers/googleAuth.js";
import {
  sendOTPController,
  verifyOTPController
} from "./auth.controller.js";
import { googleCallback } from "./auth.controller.js";
const router = express.Router();

router.post("/login",loginValidation,signInUser);
router.post("/signup",signUpvalidation,signUpUser);
router.post("/logout", logoutUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
 "/google/callback",
 passport.authenticate("google", {
   failureRedirect: "/login",
   session: false,
 }),
 googleCallback
);

router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);


export default router;