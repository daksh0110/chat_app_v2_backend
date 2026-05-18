import { CHAT_EVENT, ChatEventModel } from "../models/chat_events_modal";
import { getNextSequence } from "../models/counter_modal";

interface CreateChatEventInput {
  chat_id: string;

  actor_id: string;

  event: CHAT_EVENT;

  message_id?: string;

  payload?: Record<string, any>;
}

export async function createChatEvent(data: CreateChatEventInput) {
  const sequence = await getNextSequence("chat_events");

  return ChatEventModel.create({
    sequence,

    chat_id: data.chat_id,

    message_id: data.message_id,

    actor_id: data.actor_id,

    event: data.event,

    payload: data.payload || {},
  });
}
