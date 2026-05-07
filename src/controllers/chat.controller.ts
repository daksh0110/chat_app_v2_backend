import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { createResponse } from "../util/response";
import { IUser } from "../models/user.model";
import { chatService } from "../services/chat.service";
import createHttpError from "http-errors";
import mongoose from "mongoose";

const getChatByIdController = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, {
        message: "Invalid or missing chat id",
      });
    }

    const user = (req as any).user as IUser;

    const response = await chatService.getChatById(id, user._id.toString());

    createResponse(res, 200, "Group chat fetched successfully", response);
  },
);
export const chatController = {
  getChatByIdController,
};
