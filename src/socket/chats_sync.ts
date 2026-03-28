import { Socket } from "socket.io";
import { userService } from "../services/user.service";
export const syncChats = async (socket: Socket, userId: string) => {
  socket.on("chat_sync", async () => {
    try {
      const chats = await userService.getChatsService(userId);

      for (const msg of chats.messages) {
        socket.emit("receive_message", {
          message_id: msg.id.toString(),
          chat_id: msg.chat_id,
          message: msg.message,
          sender_id: msg.sender_id.toString(),
          created_at: msg.created_at,
        });
      }

      console.log("Synced messages:", chats.messages.length);
    } catch (error) {
      socket.emit("chat_sync_error", {
        message: "Failed to sync chats",
      });
    }
  });
};
