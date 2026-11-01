import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { messageService } from "../services/message.service";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

export const deleteMessageSocket = (socket: Socket, userId: string) => {
  socket.on("delete_message", async (data, callback) => {
    try {
      const { message_id, chat_id, delete_type } = data;

      if (!message_id || !chat_id) {
        if (typeof callback === "function") {
          callback({ error: true, message: "Missing required fields" });
        }
        return;
      }

      if (delete_type === "everyone") {
        const result = await messageService.deleteMessageForEveryone(
          message_id,
          userId,
        );

        const payload = {
          message_id: result.message_id,
          chat_id: result.chat_id,
          deleted_by: result.deleted_by,
          delete_type: "everyone",
          is_deleted: true,
        };

        const eventPayload = await createChatEvent({
          chat_id,
          actor_id: userId,
          event: CHAT_EVENT.MESSAGE_DELETED,
          message_id,
          payload,
        });

        const broadcastPayload = {
          ...payload,
          sequence: eventPayload.sequence,
        };

        if (typeof callback === "function") {
          callback(broadcastPayload);
        }

        io.to(chat_id).emit("message_deleted", broadcastPayload);
      } else {
        const result = await messageService.deleteMessageForMe(
          message_id,
          userId,
        );

        if (typeof callback === "function") {
          callback({
            success: true,
            message_id: result.message_id,
            chat_id: result.chat_id,
            delete_type: "me",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to delete message:", error);
      if (typeof callback === "function") {
        callback({
          error: true,
          message: error?.message || "Failed to delete message",
        });
      }
    }
  });
};

