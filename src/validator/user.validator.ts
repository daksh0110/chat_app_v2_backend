import { body } from "express-validator";

const createUserValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginUserValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const googleAuthValidation = [
  body("token").notEmpty().withMessage("token is required").bail(),
];

export const userValidation = {
  createUserValidator,
  loginUserValidator,
  googleAuthValidation,
};
