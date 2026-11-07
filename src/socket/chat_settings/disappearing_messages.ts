import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatSettingsService } from "../../services/chat_settings.service";

export const disappearingMessagesSocket = (socket: Socket, userId: string) => {
  socket.on("update_disappearing_messages", async (data, callback) => {
    try {
      const { chatId, duration } = data;
      if (!chatId || duration === undefined) {
        if (callback) callback({ error: true, message: "Missing chatId or duration" });
        return;
      }

      const result = await chatSettingsService.updateDisappearingMessages(
        userId,
        chatId,
        Number(duration)
      );

      if (callback) callback({ success: true, ...result });

      // Broadcast to all participants in this chat
      io.to(chatId).emit("disappearing_messages_updated", result);
    } catch (error: any) {
      console.error("Error setting disappearing messages:", error);
      if (callback) {
        callback({ error: true, message: error.message || "Failed to set disappearing messages" });
      }
    }
  });
};

