import { Socket } from "socket.io";
import { chatSettingsService } from "../../services/chat_settings.service";

export const updateChatSettingsSocket = (socket: Socket, userId: string) => {
  socket.on("update_chat_settings", async (data, callback) => {
    try {
      const { chatId, updates } = data;
      if (!chatId || !updates) {
        if (callback) callback({ error: true, message: "Missing chatId or updates" });
        return;
      }

      const settings = await chatSettingsService.updateSettings(
        userId,
        chatId,
        updates
      );

      const response = {
        success: true,
        chatId,
        settings,
      };

      if (callback) callback(response);
      // Emit back to the user's other sessions / devices
      socket.to(userId).emit("chat_settings_updated", response);
    } catch (error: any) {
      console.error("Error updating chat settings:", error);
      if (callback) {
        callback({ error: true, message: error.message || "Failed to update chat settings" });
      }
    }
  });
};

