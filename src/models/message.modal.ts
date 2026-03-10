import { model, Schema, Types } from "mongoose";

export interface IMessage {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: true,
    },

    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ chat_id: 1, createdAt: -1 });

messageSchema.index({ sender_id: 1 });

export const MessageModel = model<IMessage>("Message", messageSchema);
