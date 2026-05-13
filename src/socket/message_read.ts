import { Socket } from "socket.io";
import { MessageModel, MessageStatus } from "../models/message.modal";
import { MessageStatusModel } from "../models/message_status_modal";

export const messageRead = (socket: Socket) => {
  socket.on("message_read", async (data) => {
    try {
      const { message_id, chat_id } = data;

      const message = await MessageModel.findById(message_id);

      if (!message) return;

      const currentStatus = await MessageStatusModel.findOne({
        message_id,
        user_id: socket.data.userId,
      });

      if (!currentStatus) return;

      currentStatus.status = MessageStatus.READ;
      currentStatus.read_at = new Date();
      await currentStatus.save();

      socket.to(chat_id).emit("message_read", {
        chat_id,
        message_status: {
          message_id: currentStatus.message_id,
          user_id: currentStatus.user_id,
          status: currentStatus.status,
          delivered_at: currentStatus.delivered_at?.getTime() ?? null,
          read_at: currentStatus.read_at?.getTime() ?? null,
          created_at: currentStatus.created_at?.getTime() ?? null,
          updated_at: currentStatus.updated_at?.getTime() ?? null,
        },
      });
    } catch (error) {
      console.error("message_read error:", error);
    }
  });
};
