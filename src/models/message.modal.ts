import { model, Schema, Types } from "mongoose";
import { MediaModel } from "./media_modal";

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
}

export interface IMessage {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: MessageStatus;
  media?: Types.ObjectId[];
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
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
      },
    ],
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ chat_id: 1, createdAt: -1 });

messageSchema.index({ sender_id: 1 });

export const MessageModel = model<IMessage>("Message", messageSchema);
