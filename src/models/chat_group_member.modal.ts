import { Schema, Types } from "mongoose";

export enum ROLE {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface IChatMember {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  role?: ROLE;
  is_active: boolean;
}

const chatMemberSchema = new Schema<IChatMember>(
  {
    chat_id: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

chatMemberSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });
