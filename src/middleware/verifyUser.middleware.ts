import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { verifyToken } from "../util/jwt";
import { UserModel } from "../models/user.model";

export const verifyUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createHttpError(401, {
        message: "Authorization token is required",
      });
    }
    const token = authHeader.split(" ")[1];
    const userInfo = verifyToken(token);
    if (!userInfo.userId) {
      throw createHttpError(400, { message: "Invalid accessToken" });
    }

    const user = await UserModel.findById(userInfo.userId)
      .select("name email _id")
      .lean();

    (req as any).user = user;
    next();
  },
);
