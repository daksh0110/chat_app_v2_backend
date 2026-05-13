import { model, Schema, Types } from "mongoose";

export enum CHAT_EVENT {
  MESSAGE_SENT = "MESSAGE_SENT",
  MESSAGE_DELIVERED = "MESSAGE_DELIVERED",
  MESSAGE_READ = "MESSAGE_READ",
}

export interface ChatEvent {
  chat_id: Types.ObjectId;
  message_id: Types.ObjectId;
  event: CHAT_EVENT;
  user_id: Types.ObjectId;
  synced: boolean;
  synced_at: Date | null;
}

const chatEventSchema = new Schema<ChatEvent>(
  {
    chat_id: {
      type: Types.ObjectId,
      required: true,
    },
    message_id: {
      type: Types.ObjectId,
      required: true,
    },
    event: {
      type: String,
      enum: Object.values(CHAT_EVENT),
      required: true,
    },
    user_id: {
      type: Types.ObjectId,
      required: true,
    },
    synced: {
      type: Boolean,
      default: false,
    },
    synced_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const ChatEventModel = model<ChatEvent>("ChatEvent", chatEventSchema);

chatEventSchema.index(
  { synced_at: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24,
    partialFilterExpression: {
      synced: true,
    },
  },
);
