import {body} from "express-validator"
import { validationResult } from "express-validator";

export const signUpvalidation = [
     body("username").notEmpty().withMessage("Username required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
]

export const loginValidation = [
    body("email").isEmail(),
    body("password").notEmpty(),
]


export const validate = (req,res,next)=>{
 const errors = validationResult(req);
 if(!errors.isEmpty()){
   return res.status(400).json({errors:errors.array()});
 }
 next();
}