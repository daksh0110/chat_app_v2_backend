import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { messageService } from "../services/message.service";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

export const pinMessageSocket = (socket: Socket, userId: string) => {
  socket.on("pin_message", async (data, callback) => {
    try {
      const { message_id, chat_id, is_pinned } = data;

      if (!message_id || !chat_id || typeof is_pinned !== "boolean") {
        if (typeof callback === "function") {
          callback({ error: true, message: "Missing required fields" });
        }
        return;
      }

      const result = await messageService.pinMessage(
        message_id,
        userId,
        is_pinned,
      );

      const payload = {
        message_id: result.message_id,
        chat_id: result.chat_id,
        is_pinned: result.is_pinned,
        pinned_at: result.pinned_at,
        pinned_by: result.pinned_by,
      };

      const eventPayload = await createChatEvent({
        chat_id,
        actor_id: userId,
        event: CHAT_EVENT.MESSAGE_PINNED,
        message_id,
        payload,
      });

      const broadcastPayload = {
        ...payload,
        sequence: eventPayload.sequence,
      };

      if (typeof callback === "function") {
        callback({ success: true, ...broadcastPayload });
      }

      io.to(chat_id).emit("message_pinned", broadcastPayload);
    } catch (error: any) {
      console.error("Failed to pin message:", error);
      if (typeof callback === "function") {
        callback({
          error: true,
          message: error?.message || "Failed to pin message",
        });
      }
    }
  });
};

