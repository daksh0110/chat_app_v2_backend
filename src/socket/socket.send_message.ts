import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { messageService } from "../services/message.service";
export const sendMessageSocket = (socket: Socket, userId: string) => {
  socket.on("send_message", async (data, callback) => {
    try {
      const { message, receiver_id, temp_id, chat_id } = data;
      let chatId = chat_id;

      if (!chatId) {
        if (!receiver_id) {
          throw new Error("Receiver ID is required if chat ID is not provided");
        }
        chatId = await messageService.findOrCreateChatId(userId, receiver_id);
      }

      io.in(userId).socketsJoin(chatId.toString());
      if (!chat_id && receiver_id) {
        io.in(receiver_id).socketsJoin(chatId.toString());
      }

      const payload = await messageService.createMessage(
        userId,
        chatId,
        message,
        temp_id,
      );
      if (callback) {
        callback?.(payload);
      }

      io.to(chatId.toString()).emit("receive_message", payload);
    } catch (error) {
      console.error("Send message error:", error);

      if (callback) {
        callback({
          error: true,
          message: "Failed to send message",
        });
      }
    }
  });
};
export default sendMessageSocket;
