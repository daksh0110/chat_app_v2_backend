import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatService } from "../../services/chat.service";

export const removeGroupMember = (socket: Socket, actorId: string) => {
  socket.on("remove-group-member", async (data, callback) => {
    try {
      const { chatId, userId: memberId } = data;
      const { payload, eventPayload } = await chatService.changeGroupMember(
        actorId,
        chatId,
        memberId,
        "remove",
      );
      const emittedData = { ...payload, sequence: eventPayload.sequence };
      io.to(payload.chat_id).emit("group-member-removed", emittedData);
      io.in(payload.user_id).socketsLeave(payload.chat_id);
      callback({
        success: true,
        message: "Group member removed successfully",
        ...emittedData,
      });
    } catch (error: any) {
      console.error("Failed to remove group member:", error);
      callback({
        success: false,
        message: error?.message || "Failed to remove group member",
      });
    }
  });
};
