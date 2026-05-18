import { Socket } from "socket.io";
import { MessageModel, MessageStatus } from "../models/message.modal";
import { MessageStatusModel } from "../models/message_status_modal";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";
export const messageDelivered = (socket: Socket) => {
  socket.on("message_delivered", async ({ message_id, chat_id }) => {
    try {
      const message = await MessageModel.findById(message_id);

      if (!message) return;

      const currentStatus = await MessageStatusModel.findOne({
        message_id,
        user_id: socket.data.userId,
      });

      if (!currentStatus) return;
      if (
        currentStatus.status === MessageStatus.DELIVERED ||
        currentStatus.status === MessageStatus.READ
      ) {
        return;
      }
      currentStatus.status = MessageStatus.DELIVERED;
      currentStatus.delivered_at = new Date();
      await currentStatus.save();

      const payload = {
        chat_id,
        message_status: {
          message_id: currentStatus.message_id,
          user_id: currentStatus.user_id,
          status: currentStatus.status,
          delivered_at: currentStatus.delivered_at.getTime() ?? null,
          read_at: currentStatus.read_at?.getTime() ?? null,
          created_at: currentStatus.created_at?.getTime() ?? null,
          updated_at: currentStatus.updated_at?.getTime() ?? null,
        },
      };

      const eventPayload = await createChatEvent({
        chat_id: chat_id,
        actor_id: socket.data.userId,
        event: CHAT_EVENT.MESSAGE_DELIVERED,
        message_id: message_id,
        payload: payload,
      });

      socket.to(chat_id).emit("message_delivered", {
        ...payload,
        sequence: eventPayload.sequence,
      });
    } catch (error) {
      console.error("message_delivered error:", error);
    }
  });
};
