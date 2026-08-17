import { Socket } from "socket.io";
import { onlineUsers } from "./socket.connection";
import { ChatMemberModel } from "../models/chat_group_member.modal";

export const checkUserStatus = (socket: Socket) => {
  socket.on("check_user_status", ({ userId }) => {
    const isOnline = onlineUsers.has(userId);

    socket.emit("user_status", {
      userId,
      online: isOnline,
    });
  });

  socket.on("check_group_status", async ({ chatId }) => {
    try {
      const members = await ChatMemberModel.find({
        chat_id: chatId,
        is_active: true,
      }).select("user_id");

      const onlineMembers = members
        .map((m) => m.user_id.toString())
        .filter((id) => onlineUsers.has(id));

      socket.emit("group_status", {
        chatId,
        onlineMembers,
      });
    } catch (error) {
      console.error("check_group_status error:", error);
    }
  });
};
