import { Router } from "express";
import { validation } from "../middleware/validate.middleware";
import { userValidation } from "../validator/user.validator";
import { userController } from "../controllers/user.controller";
import { verifyUser } from "../middleware/verifyUser.middleware";

const router = Router();

router
  .post(
    "/create",
    validation(userValidation.createUserValidator),
    userController.createUser,
  )

  .post(
    "/send-email-verification-otp",
    validation(userValidation.sendEmailVerificationOtpValidation),
    userController.sendEmailVerificationOtpController,
  )

  .post(
    "/verify-email-otp",
    userValidation.verifyEmailOtpValidation,
    userController.verifyEmailController,
  )

  .post("/login", userValidation.loginUserValidator, userController.loginUser)
  .post(
    "/google/auth",
    userValidation.googleAuthValidation,
    userController.googleAuth,
  )
  .get("/", verifyUser, userValidation.getUsers, userController.getUsers)
  .get("/me", userController.getMyProfile)
  .get("/chats/", verifyUser, userController.getChatsController)
  .post(
    "/send-otp",
    userValidation.emailValidation,
    userController.sendOtpController,
  )
  .post(
    "/verify-otp",
    userValidation.verifyOtpValidation,
    userController.verifyOtpController,
  )
  .patch(
    "/change-password",
    userValidation.changePasswordValidation,
    userController.changePasswordController,
  )
  .get("/:id", userValidation.getUserById, userController.getUserById);

export default router;
