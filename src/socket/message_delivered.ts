import { Socket } from "socket.io";
import { MessageModel, MessageStatus } from "../models/message.modal";

export const messageDelivered = (socket: Socket) => {
  socket.on("message_delivered", async ({ message_id, chat_id }) => {
    try {
      const message = await MessageModel.findById(message_id);

      if (!message) return;

      if (
        message.status === MessageStatus.DELIVERED ||
        message.status === MessageStatus.READ
      ) {
        return;
      }

      message.status = MessageStatus.DELIVERED;
      await message.save();

      socket.to(chat_id).emit("message_delivered", {
        message_id,
        chat_id
      });
    } catch (error) {
      console.error("message_delivered error:", error);
    }
  });
};
