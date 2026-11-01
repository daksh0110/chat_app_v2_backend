import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatService } from "../../services/chat.service";

export const leaveGroup = (socket: Socket, userId: string) => {
  socket.on("leave-group", async (data, callback) => {
    try {
      const { chatId } = data;
      const { payload, eventPayload } = await chatService.leaveGroup(
        userId,
        chatId,
      );
      const emittedData = { ...payload, sequence: eventPayload.sequence };
      io.to(payload.chat_id).emit("group-member-left", emittedData);
      socket.leave(payload.chat_id);
      io.in(userId).socketsLeave(payload.chat_id);

      if (payload.promoted_admin_id) {
        io.to(payload.chat_id).emit("group-member-role-updated", {
          chat_id: payload.chat_id,
          user_id: payload.promoted_admin_id,
          role: "ADMIN",
          actor_id: userId,
          member_name: "",
          actor_name: payload.member_name,
        });
      }

      if (typeof callback === "function") {
        callback({
          success: true,
          message: "Left group successfully",
          ...emittedData,
        });
      }
    } catch (error: any) {
      console.error("Failed to leave group:", error);
      if (typeof callback === "function") {
        callback({
          success: false,
          message: error?.message || "Failed to leave group",
        });
      }
    }
  });
};
