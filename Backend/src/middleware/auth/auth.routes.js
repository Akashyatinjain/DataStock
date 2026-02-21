import express from "express"
import { signInUser, signUpUser } from "./auth.controller.js"
import { signUpvalidation,loginValidation } from "./auth.validation.js";
const router = express.Router();

router.post("/login",loginValidation,signInUser);
router.post("signup",signUpvalidation,signUpUser);

export default router;