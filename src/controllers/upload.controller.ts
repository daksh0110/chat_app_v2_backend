import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { createResponse } from "../util/response";
import { IUser } from "../models/user.model";
import createHttpError from "http-errors";

import { awsService } from "../services/aws.service";
import { uploadService } from "../services/upload.service";

const getPreSignedUrlController = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { entity_type, asset_type, content_type, entity_id } = req.body;
    // console.log("Request body:", req.body);
    const user = (req as any).user as IUser;
    console.log("Request body:", req.body);
    const key = uploadService.createKey({
      entityType: entity_type,
      entityId: entity_id || user._id.toString(),
      assetType: asset_type,
    });
    console.log("Generated S3 Key:", key);
    const response = await awsService.putPresignedUrl(key, content_type);

    createResponse(res, 200, "Pre-signed URL generated successfully", {
      url: response,
      key,
      content_type: content_type,
    });
  },
);

const getGetPresignedUrlController = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { key } = req.query;
    if (!key || typeof key !== "string") {
      throw createHttpError(400, {
        message: "Key query parameter is required",
      });
    }
    const url = await uploadService.getPresignedGetUrl(key);

    createResponse(res, 200, "GET Pre-signed URL generated successfully", {
      url,
      key,
    });
  },
);

export const uploadController = {
  getPreSignedUrlController,
  getGetPresignedUrlController,
};
