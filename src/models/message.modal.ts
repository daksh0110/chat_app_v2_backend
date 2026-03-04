import { model, Schema } from "mongoose";

export interface IMessage {
  message: string;
}

const MessageSchema = new Schema<IMessage>({
  message: {
    type: String,
  },
});

export const MessageModel = model<IMessage>("Message", MessageSchema);
