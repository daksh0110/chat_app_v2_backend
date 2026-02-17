import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import { createResponse } from "../util/response";

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

export const userController = {
  createUser,
  loginUser,
};
