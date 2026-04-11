import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
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
  createResponse(res, 200, "Login Successfully", response);
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
  const response = await userService.getUserById(id as string);
  createResponse(res, 200, "User fetched successfully", response);
});

const getChatsController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;

  const response = await userService.getChatsService(user._id.toString());
  createResponse(res, 200, "chats fetched successfully", response);
});

const sendOtpController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const response = await userService.sendOtpService(email);
  console.log(response);
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
};
