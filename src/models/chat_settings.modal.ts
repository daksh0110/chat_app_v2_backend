import { Schema, model, Types, Document } from "mongoose";

export interface INotificationSettings {
  is_muted: boolean;
  muted_until?: Date | null;
}

export interface IChatManagementSettings {
  is_pinned: boolean;
  pinned_at?: Date | null;
  is_archived: boolean;
  archived_at?: Date | null;
}

export interface IDisappearingMessagesSettings {
  duration: number; // in seconds (0 = off)
}

export interface IChatSettings extends Document {
  user_id: Types.ObjectId;
  chat_id: Types.ObjectId;
  notifications: INotificationSettings;
  chat_management: IChatManagementSettings;
  disappearing_messages: IDisappearingMessagesSettings;
  created_at: Date;
  updated_at: Date;
}

const chatSettingsSchema = new Schema<IChatSettings>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: true,
      index: true,
    },
    notifications: {
      is_muted: {
        type: Boolean,
        default: false,
      },
      muted_until: {
        type: Date,
        default: null,
      },
    },
    chat_management: {
      is_pinned: {
        type: Boolean,
        default: false,
      },
      pinned_at: {
        type: Date,
        default: null,
      },
      is_archived: {
        type: Boolean,
        default: false,
      },
      archived_at: {
        type: Date,
        default: null,
      },
    },
    disappearing_messages: {
      duration: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

chatSettingsSchema.index({ user_id: 1, chat_id: 1 }, { unique: true });

export const ChatSettingsModel = model<IChatSettings>(
  "ChatSettings",
  chatSettingsSchema
);
