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
    if (!token) {
      throw createHttpError(401, { message: "Invalid access token" });
    }

    let userInfo;
    try {
      userInfo = verifyToken(token);
    } catch {
      throw createHttpError(401, {
        message: "Invalid or expired access token",
      });
    }

    if (!userInfo.userId) {
      throw createHttpError(401, { message: "Invalid access token" });
    }

    const user = await UserModel.findById(userInfo.userId)
      .select("name email _id")
      .lean();

    if (!user) {
      throw createHttpError(401, { message: "User does not exist" });
    }

    (req as any).user = user;
    next();
  },
);
