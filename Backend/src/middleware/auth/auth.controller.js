import asyncHandler from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";
import { createToken } from "../../utils/token.utils.js";


export const signUpUser = asyncHandler(async (req, res) => {
   const result = await authService.signUpUserLocal(req.body, res);
  return res.status(201).json(result);  
});



export const signInUser = asyncHandler(async (req, res) => {
  const result = await authService.signInUserLocal(req.body, res);
  return res.status(200).json(result);
});


export const googleCallback = async (req, res) => {
  try {

    const user = await authService.googleLogin(req.user);

    const token = createToken(user.id);
const googleUser = req.user;
console.log("Google profile:", req.user);
    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false
    });

    res.redirect("http://localhost:3000/dashboard");

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};