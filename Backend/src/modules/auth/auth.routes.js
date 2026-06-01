import express from "express"
import { signInUser, signUpUser,logoutUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
import passport from "./providers/googleAuth.js";
import jwt from "jsonwebtoken";

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
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    // Generate JWT from the user passport gave you
    const token = jwt.sign(
      { id: req.user.googleId, email: req.user.email, name: req.user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send token to frontend via URL param
    res.redirect(`${process.env.VITE_API_URL}/dashboard?token=${token}`);
  }
);

router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);


export default router;