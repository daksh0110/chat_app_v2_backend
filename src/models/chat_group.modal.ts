import { model, Schema, Types } from "mongoose";

export enum CHAT_TYPE {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export interface IChatGroup {
  name?: string;
  type: CHAT_TYPE;
  created_by?: Types.ObjectId;
  image?: string;
  media?: Types.ObjectId;
  bio: string;
}

const chatGroupSchema = new Schema<IChatGroup>(
  {
    name: {
      type: String,
    },

    type: {
      type: String,
      enum: Object.values(CHAT_TYPE),
      required: true,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    image: {
      type: String,
      required: false,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    bio: { type: String, required: false, default: "" },
  },
  {
    timestamps: true,
  },
);

export const ChatGroupModel = model<IChatGroup>("ChatGroup", chatGroupSchema);
