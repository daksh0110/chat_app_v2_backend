import { model, Schema, Types } from "mongoose";

export interface IMessageReaction {
  message_id: Types.ObjectId;
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  emoji: string;
  created_at?: Date;
}

const messageReactionSchema = new Schema<IMessageReaction>(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
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
    emoji: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  },
);

// One reaction per user per message
messageReactionSchema.index({ message_id: 1, user_id: 1 }, { unique: true });

// Quick lookup: all reactions for a message
messageReactionSchema.index({ message_id: 1 });

export const MessageReactionModel = model<IMessageReaction>(
  "MessageReaction",
  messageReactionSchema,
);

