import { Socket } from "socket.io";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";

export const userUpdatedSocket = (socket: Socket) => {
  socket.on("user-info-updated", async (data) => {
    try {
      const eventPayload = await createChatEvent({
        actor_id: socket.data.userId,
        event: CHAT_EVENT.USER_DETAIL_EVENT,
        payload: data,
        is_global: true,
      });

      socket.broadcast.emit("user-info-updated", {
        user_id: data.user_id,
        sequence: eventPayload.sequence,
      });
    } catch (error) {
      console.error("user update event failed ");
    }
  });
};
