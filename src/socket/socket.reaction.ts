import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { reactionService } from "../services/reaction.service";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

export const messageReactionSocket = (socket: Socket, userId: string) => {
  socket.on("message_reaction", async (data, callback) => {
    try {
      const { message_id, chat_id, emoji } = data;

      if (!message_id || !chat_id || !emoji) {
        if (callback) {
          callback({ error: true, message: "Missing required fields" });
        }
        return;
      }

      const { removed, summary } = await reactionService.toggleReaction(
        userId,
        message_id,
        chat_id,
        emoji,
      );

      const payload = {
        message_id,
        chat_id,
        user_id: userId,
        emoji,
        removed,
        reactions: summary,
      };

      const eventPayload = await createChatEvent({
        chat_id,
        actor_id: userId,
        event: CHAT_EVENT.MESSAGE_REACTION,
        message_id,
        payload,
      });

      const broadcastPayload = {
        ...payload,
        sequence: eventPayload.sequence,
      };

      if (callback) {
        callback(broadcastPayload);
      }

      io.to(chat_id).emit("message_reaction", broadcastPayload);
    } catch (error) {
      console.error("Message reaction error:", error);
      if (callback) {
        callback({ error: true, message: "Failed to toggle reaction" });
      }
    }
  });
};

