import {body} from "express-validator"

export const signUpvalidation = [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
]

export const loginValidation = [
    body("email").isEmail(),
    body("password").notEmpty(),
]