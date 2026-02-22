import asyncHandler from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";


export const signUpUser = asyncHandler(async (req, res) => {
   const result = await authService.signUpUserLocal(req.body, res);
  return res.status(201).json(result);  
});



export const signInUser = asyncHandler(async (req, res) => {
  const result = await authService.signInUserLocal(req.body, res);
  return res.status(200).json(result);
});