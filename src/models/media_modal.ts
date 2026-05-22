import { model, Schema, Types } from "mongoose";

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  FILE = "FILE",
  AUDIO = "AUDIO",
}

export interface MediaModel {
  key: string;
  content_type: string;
  actor_id: Types.ObjectId;
  type?: MediaType;
  name?: string;
}

const mediaSchema = new Schema<MediaModel>(
  {
    key: {
      type: String,
      required: true,
    },
    content_type: {
      type: String,
      required: true,
    },
    actor_id: {
      type: Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MediaType),
    },
    name: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const MediaModel = model<MediaModel>("Media", mediaSchema);
