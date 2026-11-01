import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import { requestService } from "../services/request_service";
import { createResponse } from "../util/response";
import createHttpError from "http-errors";
import { IUser } from "../models/user.model";

const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const response = await userService.createUser(data);
  createResponse(res, 200, "User Registration Started Successfully", response);
});

const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const { verification_token, otp } = req.body;
    const response = await userService.verifyEmailOtpService({
      email_verification_token: verification_token,
      otp,
    });
    createResponse(res, 200, "OTP Verified Successfully", response);
  },
);

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const response = await userService.loginUser(data);
  createResponse(res, 200, "Login Successfully", response);
});

const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const response = await userService.googleauth(data);
  createResponse(res, 200, "Token Verified Successfully", response);
});

const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = req.query;
  const user = (req as any).user as IUser;
  const response = await userService.getUsers(data, user._id.toString());
  createResponse(res, 200, "User Fetched sucessfuly", response);
});

const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw createHttpError(401, { message: "Authorization token is required" });
  }
  const token = authHeader.split(" ")[1];
  const response = await userService.getMyProfile(token ?? "");
  createResponse(res, 200, "User Fetched sucessfuly", response);
});

const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as IUser;
  const response = await userService.getUserById(
    id as string,
    user._id.toString(),
  );
  createResponse(res, 200, "User fetched successfully", response);
});

const sendFriendRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    const response = await requestService.sendFriendRequestService(
      user._id.toString(),
      req.params.id as string,
    );
    createResponse(res, 201, "Friend request sent successfully", response);
  },
);

const removeFriendController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.removeFriendService(
      user._id.toString(),
      req.params.id as string,
    );
    createResponse(res, 200, "Friend removed successfully", null);
  },
);

const cancelFriendRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.cancelFriendRequestService(
      user._id.toString(),
      req.params.id as string,
    );
    createResponse(res, 200, "Friend request cancelled successfully", null);
  },
);

const blockUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.blockUserService(
      user._id.toString(),
      req.params.id as string,
    );
    createResponse(res, 200, "User blocked successfully", null);
  },
);

const unblockUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.unblockUserService(
      user._id.toString(),
      req.params.id as string,
    );
    createResponse(res, 200, "User unblocked successfully", null);
  },
);

const getChatsController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;

  const response = await userService.getChatsService(user._id.toString());
  createResponse(res, 200, "chats fetched successfully", response);
});

const sendOtpController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const response = await userService.sendOtpService(email);
  createResponse(res, 200, "OTP sent successfully", response);
});

const verifyOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const { reset_token, otp } = req.body;

    const response = await userService.verifyOtpService({ otp, reset_token });
    createResponse(res, 200, "OTP verified successfully", response);
  },
);

const sendEmailVerificationOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const response = await userService.sendEmailVerificationOtpService(email);
    createResponse(res, 200, "OTP sent successfully", response);
  },
);

const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { reset_token, new_password } = req.body;

    await userService.changePasswordService({
      reset_token,
      new_password,
    });
    createResponse(res, 200, "Password changed successfully", null);
  },
);

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const data = req.body;

  const response = await userService.updateUserService(
    user._id.toString(),
    data,
  );
  createResponse(res, 200, "User updated successfully", response);
});

export const googleAuthSetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body;
    const response = await userService.googleAuthSetPassword(data);
    createResponse(res, 200, "Password set successfully", response);
  },
);

const updateFcmTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    const { fcm_token } = req.body;
    await userService.updateFcmTokenService(user._id.toString(), fcm_token);
    createResponse(res, 200, "FCM token updated successfully", null);
  },
);

const getFriendRequestsController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    const response = await requestService.getFriendRequestsService(
      user._id.toString(),
    );
    createResponse(res, 200, "Friend requests fetched successfully", response);
  },
);

const getFriendsListController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    const response = await requestService.getFriendsListService(
      user._id.toString(),
    );
    createResponse(res, 200, "Friends list fetched successfully", response);
  },
);

const acceptFriendRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.acceptFriendRequestService(
      req.params.id as string,
      user._id.toString(),
    );
    createResponse(res, 200, "Friend request accepted successfully", null);
  },
);

const rejectFriendRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    await requestService.rejectFriendRequestService(
      req.params.id as string,
      user._id.toString(),
    );
    createResponse(res, 200, "Friend request rejected successfully", null);
  },
);

const getAllRelationshipsController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
    const response = await requestService.getAllRelationshipsService(
      user._id.toString(),
    );
    createResponse(
      res,
      200,
      "All relationships fetched successfully",
      response,
    );
  },
);

export const userController = {
  createUser,
  loginUser,
  googleAuth,
  getUsers,
  getMyProfile,
  getUserById,
  getChatsController,
  sendOtpController,
  verifyOtpController,
  changePasswordController,
  verifyEmailController,
  sendEmailVerificationOtpController,
  updateUser,
  googleAuthSetPasswordController,
  updateFcmTokenController,
  sendFriendRequestController,
  removeFriendController,
  cancelFriendRequestController,
  blockUserController,
  unblockUserController,
  getFriendRequestsController,
  getFriendsListController,
  getAllRelationshipsController,
  acceptFriendRequestController,
  rejectFriendRequestController,
};
