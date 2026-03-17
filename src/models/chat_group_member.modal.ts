import { model, Schema, Types } from "mongoose";

export enum ROLE {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface IChatMember {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  role: ROLE;
  is_active: boolean;
}

const chatMemberSchema = new Schema<IChatMember>(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: true,
    },

    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.MEMBER,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

chatMemberSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });

chatMemberSchema.index({ user_id: 1 });

chatMemberSchema.index({ chat_id: 1 });

export const ChatMemberModel = model<IChatMember>(
  "ChatMember",
  chatMemberSchema,
);
