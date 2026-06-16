import { body } from "express-validator";
import { validationResult } from "express-validator";

export const signUpvalidation = [
  body("username")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Username must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage(
      "Password must include uppercase, lowercase, and a number"
    ),
];

export const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const otpSendValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
];

export const otpVerifyValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0]?.msg || "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};
