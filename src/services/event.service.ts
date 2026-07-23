import { CHAT_EVENT, ChatEventModel } from "../models/chat_events_modal";
import { getNextSequence } from "../models/counter_modal";

interface CreateChatEventInput {
  chat_id?: string;

  actor_id: string;

  event: CHAT_EVENT;

  message_id?: string;

  payload?: Record<string, any>;

  is_global?: boolean;
}

export async function createChatEvent(data: CreateChatEventInput) {
  const sequence = await getNextSequence("chat_events");

  const eventData: Record<string, any> = {
    sequence,
    actor_id: data.actor_id,
    event: data.event,
    payload: data.payload || {},
    is_global: !!data.is_global,
  };

  if (data.chat_id) {
    eventData.chat_id = data.chat_id;
  }

  if (data.message_id) {
    eventData.message_id = data.message_id;
  }

  return ChatEventModel.create(eventData);
}
