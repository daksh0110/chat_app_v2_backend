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

  .patch(
    "/update-profile",
    verifyUser,
    userValidation.updateUserValidator,
    userController.updateUser,
  )
  .post("/login", userValidation.loginUserValidator, userController.loginUser)
  .post(
    "/google/verify-auth-token",
    userValidation.googleAuthValidation,
    userController.googleAuth,
  )

  .post(
    "/google/auth/set-password",
    userValidation.googleAuthSetPasswordValidation,
    userController.googleAuthSetPasswordController,
  )
  .get("/", verifyUser, userValidation.getUsers, userController.getUsers)
  .get("/me", verifyUser, userController.getMyProfile)
  .get("/auth", verifyUser, (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Access token is valid",
    });
  })
  .get("/chats/", verifyUser, userController.getChatsController)
  .post(
    "/:id/friend-request",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.sendFriendRequestController,
  )
  .delete(
    "/:id/friend",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.removeFriendController,
  )
  .delete(
    "/:id/friend-request",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.cancelFriendRequestController,
  )
  .post(
    "/:id/block",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.blockUserController,
  )
  .delete(
    "/:id/block",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.unblockUserController,
  )
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
  .post(
    "/fcm-token",
    verifyUser,
    validation(userValidation.fcmTokenValidation),
    userController.updateFcmTokenController,
  )
  .get(
    "/friend-requests",
    verifyUser,
    userController.getFriendRequestsController,
  )
  .get("/friends", verifyUser, userController.getFriendsListController)
  .get(
    "/relationships",
    verifyUser,
    userController.getAllRelationshipsController,
  )
  .post(
    "/:id/friend-request/accept",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.acceptFriendRequestController,
  )
  .post(
    "/:id/friend-request/reject",
    verifyUser,
    validation(userValidation.userRelationshipValidation),
    userController.rejectFriendRequestController,
  )
  .get(
    "/:id",
    verifyUser,
    userValidation.getUserById,
    userController.getUserById,
  );

export default router;
