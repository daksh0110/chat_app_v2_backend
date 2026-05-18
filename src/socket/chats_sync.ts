import { Socket } from "socket.io";
import { UserLastSequenceModel } from "../models/user_last_sequence";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { ChatEventModel, CHAT_EVENT } from "../models/chat_events_modal";

export const syncChats = async (socket: Socket, userId: string) => {
  socket.on("chat_sync", async () => {
    try {
      const userSeq = await UserLastSequenceModel.findOne({ user_id: userId });
      const last_sequence = userSeq?.last_sequence || 0;

      const chatMembers = await ChatMemberModel.find({
        user_id: userId,
        is_active: true,
      });
      const chatIds = chatMembers.map((cm) => cm.chat_id);

      const missedEvents = await ChatEventModel.find({
        chat_id: { $in: chatIds },
        sequence: { $gt: last_sequence },
      }).sort({ sequence: 1 });

      for (const event of missedEvents) {
        const payloadWithSeq = { ...event.payload, sequence: event.sequence };

        switch (event.event) {
          case CHAT_EVENT.MESSAGE_SENT:
            socket.emit("receive_message", payloadWithSeq);
            break;
          case CHAT_EVENT.MESSAGE_DELIVERED:
            socket.emit("message_delivered", payloadWithSeq);
            break;
          case CHAT_EVENT.MESSAGE_READ:
            socket.emit("message_read", payloadWithSeq);
            break;
          case CHAT_EVENT.GROUP_CREATED:
            socket.emit("group-created", payloadWithSeq);
            break;
        }
      }

      console.log(`Synced ${missedEvents.length} events for user ${userId}`);
    } catch (error) {
      console.error("Failed to sync chats:", error);
      socket.emit("chat_sync_error", {
        message: "Failed to sync chats",
      });
    }
  });

  socket.on("chat_event_ack", async (data) => {
    try {
      const { sequence } = data;
      if (typeof sequence === "number") {
        await UserLastSequenceModel.findOneAndUpdate(
          { user_id: userId },
          { $max: { last_sequence: sequence } },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("chat_event_ack error:", error);
    }
  });
};
