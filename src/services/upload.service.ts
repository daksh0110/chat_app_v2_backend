import { awsService } from "./aws.service";
import createHttpError from "http-errors";

type EntityType = "user" | "chat";

type AssetType = "avatar" | "attachments";

const createKey = ({
  entityType,
  entityId,
  assetType,
}: {
  entityType: EntityType;
  entityId: string;
  assetType: AssetType;
}) => {
  const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;

  switch (entityType) {
    case "user":
      return `users/${entityId}/${assetType}/${uniqueId}`;

    case "chat":
      return `chats/${entityId}/${assetType}/${uniqueId}`;

    default:
      return `${entityType}/${entityId}/${assetType}/${uniqueId}`;
  }
};

const getPresignedGetUrl = async (key: string) => {
  if (!key) {
    throw createHttpError(400, {
      message: "Key is required",
    });
  }

  try {
    const url = await awsService.getPresignedUrl(key);
    return url;
  } catch (e: any) {
    throw createHttpError(500, {
      message: `Failed to generate download URL: ${e.message}`,
    });
  }
};

export const uploadService = {
  createKey,
  getPresignedGetUrl,
};
