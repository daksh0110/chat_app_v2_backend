import { Types } from "mongoose";
import {
  ChatSettingsModel,
  IChatSettings,
  INotificationSettings,
  IChatManagementSettings,
  IDisappearingMessagesSettings,
} from "../models/chat_settings.modal";
import { createChatEvent } from "./event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

class ChatSettingsService {
  async getSettings(userId: string, chatId: string): Promise<IChatSettings> {
    let settings = await ChatSettingsModel.findOne({
      user_id: new Types.ObjectId(userId),
      chat_id: new Types.ObjectId(chatId),
    });

    if (!settings) {
      settings = await ChatSettingsModel.create({
        user_id: new Types.ObjectId(userId),
        chat_id: new Types.ObjectId(chatId),
      });
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    chatId: string,
    updates: {
      notifications?: Partial<INotificationSettings>;
      chat_management?: Partial<IChatManagementSettings>;
      disappearing_messages?: Partial<IDisappearingMessagesSettings>;
    }
  ): Promise<IChatSettings> {
    const setPayload: Record<string, any> = {};

    if (updates.notifications) {
      if (updates.notifications.is_muted !== undefined) {
        setPayload["notifications.is_muted"] = updates.notifications.is_muted;
      }
      if (updates.notifications.muted_until !== undefined) {
        setPayload["notifications.muted_until"] = updates.notifications.muted_until;
      }
    }

    if (updates.chat_management) {
      if (updates.chat_management.is_pinned !== undefined) {
        setPayload["chat_management.is_pinned"] = updates.chat_management.is_pinned;
        setPayload["chat_management.pinned_at"] = updates.chat_management.is_pinned
          ? new Date()
          : null;
      }
      if (updates.chat_management.is_archived !== undefined) {
        setPayload["chat_management.is_archived"] =
          updates.chat_management.is_archived;
        setPayload["chat_management.archived_at"] = updates.chat_management.is_archived
          ? new Date()
          : null;
      }
    }

    if (updates.disappearing_messages?.duration !== undefined) {
      setPayload["disappearing_messages.duration"] =
        updates.disappearing_messages.duration;
    }

    const settings = await ChatSettingsModel.findOneAndUpdate(
      {
        user_id: new Types.ObjectId(userId),
        chat_id: new Types.ObjectId(chatId),
      },
      { $set: setPayload },
      { new: true, upsert: true }
    );

    return settings;
  }

  async updateDisappearingMessages(
    userId: string,
    chatId: string,
    durationSeconds: number
  ) {
    await ChatSettingsModel.updateMany(
      { chat_id: new Types.ObjectId(chatId) },
      { $set: { "disappearing_messages.duration": durationSeconds } }
    );

    const payload = {
      chat_id: chatId,
      user_id: userId,
      duration: durationSeconds,
    };

    const event = await createChatEvent({
      chat_id: chatId,
      actor_id: userId,
      event: CHAT_EVENT.DISAPPEARING_MESSAGES_UPDATED,
      payload,
    });

    return {
      ...payload,
      sequence: event.sequence,
    };
  }
}

export const chatSettingsService = new ChatSettingsService();
