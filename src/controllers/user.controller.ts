import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import { createResponse } from "../util/response";
import createHttpError from "http-errors";

const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const response = await userService.createUser(data);
  createResponse(res, 200, "User Created Successfully", response);
});

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
  const response = await userService.getUsers(data);
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

export const userController = {
  createUser,
  loginUser,
  googleAuth,
  getUsers,
  getMyProfile,
  getUserById,
};
