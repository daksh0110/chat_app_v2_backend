import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatService } from "../../services/chat.service";

export const addGroupMember = (socket: Socket, actorId: string) => {
  socket.on("add-group-member", async (data, callback) => {
    try {
      const { chatId, userId: memberId } = data;
      const { payload, eventPayload } = await chatService.changeGroupMember(
        actorId,
        chatId,
        memberId,
        "add",
      );
      const emittedData = { ...payload, sequence: eventPayload.sequence };
      io.in(payload.user_id).socketsJoin(payload.chat_id);
      io.to(payload.chat_id).emit("group-member-added", emittedData);
      if (typeof callback === "function") {
        callback({
          success: true,
          message: "Group member added successfully",
          ...emittedData,
        });
      }
    } catch (error: any) {
      console.error("Failed to add group member:", error);
      if (typeof callback === "function") {
        callback({
          success: false,
          message: error?.message || "Failed to add group member",
        });
      }
    }
  });
};
