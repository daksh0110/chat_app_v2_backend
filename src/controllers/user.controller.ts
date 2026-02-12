import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import { createResponse } from "../util/response";

const createUser = asyncHandler(async (req: Request, res: Response) => {
  const response = await userService.createUser();
  createResponse(res, 200, "User Created Successfully");
});

export const userController = {
  createUser,
};
