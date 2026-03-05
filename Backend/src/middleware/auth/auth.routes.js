import express from "express"
import { signInUser, signUpUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
import passport from "./providers/googleAuth.js";
import { sendOTP } from "./providers/otpAuth.js";
import {
  sendOTPController,
  verifyOTPController
} from "./auth.controller.js";

const router = express.Router();

router.post("/login",loginValidation,signInUser);
router.post("/signup",signUpvalidation,signUpUser);


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
  async (req, res) => {

    const googleUser = req.user;

    // here call your auth.service
    // create user if not exists

    res.redirect("http://localhost:3000/dashboard");
  }
);

router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);


export default router;