import { model, Schema, Types } from "mongoose";

export enum CHAT_EVENT {
  MESSAGE_SENT = "MESSAGE_SENT",
  MESSAGE_DELIVERED = "MESSAGE_DELIVERED",
  MESSAGE_READ = "MESSAGE_READ",
  GROUP_CREATED = "GROUP_CREATED",
}

export interface ChatEvent {
  chat_id: Types.ObjectId;
  message_id: Types.ObjectId;
  event: CHAT_EVENT;
  actor_id: Types.ObjectId;
  sequence: number;
  payload: Record<string, any>;
}

const chatEventSchema = new Schema<ChatEvent>(
  {
    chat_id: {
      type: Types.ObjectId,
      required: true,
    },
    message_id: {
      type: Types.ObjectId,
    },
    event: {
      type: String,
      enum: Object.values(CHAT_EVENT),
      required: true,
    },
    actor_id: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
    sequence: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
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

chatEventSchema.index({
  sequence: 1,
});

chatEventSchema.index({
  chat_id: 1,
  sequence: 1,
});

chatEventSchema.index({
  message_id: 1,
  event: 1,
});
