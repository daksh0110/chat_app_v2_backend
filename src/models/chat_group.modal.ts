import { model, Schema } from "mongoose";

export enum CHAT_TYPE {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}
export interface IChatGroup {
  name?: string;
  description?: string;
  type: CHAT_TYPE;
}

const chatGroupSchema = new Schema<IChatGroup>(
  {
    name: { type: String },
    description: { type: String },
    type: {
      type: String,
      enum: Object.values(CHAT_TYPE),
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const chatGroupModel = model<IChatGroup>("ChatGroup", chatGroupSchema);
