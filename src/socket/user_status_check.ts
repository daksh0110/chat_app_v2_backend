import { Socket } from "socket.io";
import { onlineUsers } from "./socket.connection";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { BlockModel } from "../models/block.model";
import { Types } from "mongoose";

export const checkUserStatus = (socket: Socket) => {
  const currentUserId = socket.data?.userId;

  socket.on("check_user_status", async ({ userId }) => {
    try {
      let isOnline = onlineUsers.has(userId);

      // If either user has blocked the other, hide online status (appear offline)
      if (
        isOnline &&
        currentUserId &&
        userId &&
        Types.ObjectId.isValid(currentUserId) &&
        Types.ObjectId.isValid(userId)
      ) {
        const isBlocked = await BlockModel.exists({
          $or: [
            { blocker_id: currentUserId, blocked_user_id: userId },
            { blocker_id: userId, blocked_user_id: currentUserId },
          ],
        });
        if (isBlocked) {
          isOnline = false;
        }
      }

      socket.emit("user_status", {
        userId,
        online: isOnline,
      });
    } catch (error) {
      console.error("check_user_status error:", error);
    }
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
