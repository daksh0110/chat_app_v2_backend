import { model, Schema, Types } from "mongoose";

export enum CHAT_TYPE {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export interface IChatGroup {
  name?: string;
  description?: string;
  type: CHAT_TYPE;
  created_by?: Types.ObjectId;
}

const chatGroupSchema = new Schema<IChatGroup>(
  {
    name: {
      type: String,
    },

    description: {
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
  },
  {
    timestamps: true,
  },
);

export const ChatGroupModel = model<IChatGroup>("ChatGroup", chatGroupSchema);
