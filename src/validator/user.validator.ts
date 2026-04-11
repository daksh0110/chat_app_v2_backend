import { body, header, param, query } from "express-validator";

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

export const getUsers = [
  query("search").optional().isString().withMessage("Search must be a string"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
];

export const getUserById = [
  param("id").isMongoId().withMessage("Invalid user id"),
];

export const getMyProfile = [
  header("authorization")
    .notEmpty()
    .withMessage("Authorization header is required")
    .matches(/^Bearer\s.+$/)
    .withMessage("Authorization must be in 'Bearer <token>' format"),
];

export const emailValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format"),
];

export const verifyOtpValidation = [
  body("reset_token").notEmpty().withMessage("reset token is required").bail(),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 4, max: 4 }),
];

export const changePasswordValidation = [
  body("reset_token").notEmpty().withMessage("Reset token is required").bail(),

  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
    .withMessage(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    ),
];

export const verifyEmailOtpValidation = [
  body("reset_token").notEmpty().withMessage("reset token is required").bail(),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 4, max: 4 }),
];

export const sendEmailVerificationOtpValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format"),
];

export const updateUserValidator = [
  body("bio")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Bio must be at most 200 characters"),
  body("profile_picture")
    .optional()
    .isURL()
    .withMessage("Invalid profile picture URL"),
];

export const userValidation = {
  createUserValidator,
  loginUserValidator,
  googleAuthValidation,
  getUsers,
  getMyProfile,
  getUserById,
  emailValidation,
  verifyOtpValidation,
  changePasswordValidation,
  verifyEmailOtpValidation,
  sendEmailVerificationOtpValidation,
  updateUserValidator,
};
