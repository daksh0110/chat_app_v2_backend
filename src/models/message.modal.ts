import { model, Schema, Types } from "mongoose";

export interface IMessage {
  message: string;
  sender_id: Types.ObjectId;
  receiver_id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    message: {
      type: String,
      required: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiver_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const MessageModel = model<IMessage>("Message", MessageSchema);
