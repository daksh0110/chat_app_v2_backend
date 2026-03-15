import { Socket } from "socket.io";
import { userService } from "../services/user.service";
export const syncChats = async (socket: Socket, userId: string) => {
  socket.on("chat_sync", async () => {
    try {
      const chats = await userService.getChatsService(userId);
      console.log("reached here");
      socket.emit("chat_sync_result", chats);
    } catch (error) {
      socket.emit("chat_sync_error", {
        message: "Failed to sync chats",
      });
    }
  });
};
