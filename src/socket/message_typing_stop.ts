import { Socket } from "socket.io";
import { ChatGroupModel, CHAT_TYPE } from "../models/chat_group.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { BlockModel } from "../models/block.model";
import { Types } from "mongoose";

export const messageTypingStop = (socket: Socket, userId: string) => {
  socket.on("stop_typing", async (data) => {
    try {
      const chat_id = data.chat_id;
      if (!chat_id || !Types.ObjectId.isValid(chat_id)) return;

      const chat = await ChatGroupModel.findById(chat_id).select("type").lean();
      if (chat?.type === CHAT_TYPE.DIRECT) {
        const members = await ChatMemberModel.find({
          chat_id,
          is_active: true,
        }).select("user_id");

        const otherMember = members.find(
          (m) => m.user_id.toString() !== userId,
        );

        if (otherMember) {
          const otherUserId = otherMember.user_id.toString();
          const isBlocked = await BlockModel.exists({
            $or: [
              { blocker_id: userId, blocked_user_id: otherUserId },
              { blocker_id: otherUserId, blocked_user_id: userId },
            ],
          });
          if (isBlocked) {
            return;
          }
        }
      }

      socket.to(chat_id).emit("user_stop_typing", { chat_id, user_id: userId });
    } catch (e) {
      console.error("stop_typing error:", e);
    }
  });
};
