import { Socket } from "socket.io";
import { MessageModel } from "../models/message.modal";

export const messageRead = (socket: Socket) => {
  socket.on("message_read", async (data) => {
    try {
      const { message_id, sender_id } = data;

      await MessageModel.findByIdAndUpdate(message_id, {
        status: "read",
      });

      socket.to(sender_id).emit("message_read", {
        message_id,
      });
    } catch (error) {
      console.error("message_read error:", error);
    }
  });
};
