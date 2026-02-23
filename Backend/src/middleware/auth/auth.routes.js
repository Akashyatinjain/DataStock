import express from "express"
import { signInUser, signUpUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
import passport from "./providers/googleAuth.js";

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

export default router;