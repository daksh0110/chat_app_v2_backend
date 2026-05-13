import { model, Schema, Types } from "mongoose";
import { MessageStatus } from "./message.modal";

export interface MessageStatusModal {
  _id: string;
  message_id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: MessageStatus;
  created_at: Date;
  updated_at: Date;
  delivered_at?: Date;
  read_at?: Date;
}

const messageStatusSchema = new Schema<MessageStatusModal>(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    delivered_at: {
      type: Date,
    },
    read_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const MessageStatusModel = model<MessageStatusModal>(
  "MessageStatus",
  messageStatusSchema,
);
