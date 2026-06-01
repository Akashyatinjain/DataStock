import asyncHandler from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";
import { createToken } from "../../utils/token.utils.js";
import { clearAuthCookie } from "../../utils/cookie.utils.js";


export const signUpUser = asyncHandler(async (req, res) => {
   const result = await authService.signUpUserLocal(req.body, res);
  return res.status(201).json(result);  
});



export const signInUser = asyncHandler(async (req, res) => {
  const result = await authService.signInUserLocal(req.body, res);
  return res.status(200).json(result);
});


export const logoutUser = (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    message: "Logout successful"
  });
};


export const sendOTPController=asyncHandler(async (req,res)=>{
  const { email } = req.body;
console.log("Email received:", email);
  const result = await authService.requestOTPService(email);

  res.json(result);
});


export const verifyOTPController = async (req, res) => {
  const { email, otp } = req.body;

  const result = await authService.verifyOTPService(email, otp);

  res.json(result);
};


export const googleCallback = async (req, res) => {
  try {
    const user = await authService.googleLogin(req.user);
    const token = createToken(user);
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};