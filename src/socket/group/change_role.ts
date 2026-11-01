import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatService } from "../../services/chat.service";
import { ROLE } from "../../models/chat_group_member.modal";

export const changeMemberRole = (socket: Socket, actorId: string) => {
  socket.on("change-group-member-role", async (data, callback) => {
    try {
      const { chatId, userId: memberId, role } = data;
      const { payload, eventPayload } = await chatService.changeMemberRole(
        actorId,
        chatId,
        memberId,
        role as ROLE,
      );
      const emittedData = {
        ...payload,
        sequence: eventPayload ? eventPayload.sequence : undefined,
      };
      io.to(payload.chat_id).emit("group-member-role-updated", emittedData);
      if (typeof callback === "function") {
        callback({
          success: true,
          message: "Role updated successfully",
          ...emittedData,
        });
      }
    } catch (error: any) {
      console.error("Failed to change member role:", error);
      if (typeof callback === "function") {
        callback({
          success: false,
          message: error?.message || "Failed to change member role",
        });
      }
    }
  });
};
