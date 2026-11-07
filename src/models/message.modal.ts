import { model, Schema, Types } from "mongoose";
import { MediaModel } from "./media_modal";

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
}

export interface IReplyTo {
  message_id: Types.ObjectId;
  sender_id?: Types.ObjectId;
  sender_name?: string;
  message?: string;
}

export interface IMessage {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: MessageStatus;
  media?: Types.ObjectId[];
  reply_to?: IReplyTo;
  is_deleted?: boolean;
  deleted_for?: Types.ObjectId[];
  is_edited?: boolean;
  edited_at?: Date;
  is_pinned?: boolean;
  pinned_at?: Date;
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
    reply_to: {
      message_id: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      sender_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      sender_name: {
        type: String,
        default: "",
      },
      message: {
        type: String,
        default: "",
      },
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_for: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    is_edited: {
      type: Boolean,
      default: false,
    },
    edited_at: {
      type: Date,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    pinned_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ chat_id: 1, createdAt: -1 });

messageSchema.index({ sender_id: 1 });

export const MessageModel = model<IMessage>("Message", messageSchema);
