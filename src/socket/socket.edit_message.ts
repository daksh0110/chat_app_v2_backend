import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { messageService } from "../services/message.service";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

export const editMessageSocket = (socket: Socket, userId: string) => {
  socket.on("edit_message", async (data, callback) => {
    try {
      const { message_id, chat_id, message } = data;

      if (!message_id || !chat_id || message === undefined) {
        if (typeof callback === "function") {
          callback({ error: true, message: "Missing required fields" });
        }
        return;
      }

      const result = await messageService.editMessage(
        message_id,
        userId,
        message,
      );

      const payload = {
        message_id: result.message_id,
        chat_id: result.chat_id,
        message: result.message,
        is_edited: true,
        edited_at: result.edited_at,
        edited_by: userId,
      };

      const eventPayload = await createChatEvent({
        chat_id,
        actor_id: userId,
        event: CHAT_EVENT.MESSAGE_EDITED,
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

      io.to(chat_id).emit("message_edited", broadcastPayload);
    } catch (error: any) {
      console.error("Failed to edit message:", error);
      if (typeof callback === "function") {
        callback({
          error: true,
          message: error?.message || "Failed to edit message",
        });
      }
    }
  });
};

