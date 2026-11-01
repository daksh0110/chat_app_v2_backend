import { Socket } from "socket.io";
import { ChatGroupModel, CHAT_TYPE } from "../models/chat_group.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { BlockModel } from "../models/block.model";
import { Types } from "mongoose";

export const messageTyping = (socket: Socket, user_id: string) => {
  socket.on("is_typing", async (data) => {
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
          (m) => m.user_id.toString() !== user_id,
        );

        if (otherMember) {
          const otherUserId = otherMember.user_id.toString();
          // Check mutual block: if either blocked the other, suppress typing
          const isBlocked = await BlockModel.exists({
            $or: [
              { blocker_id: user_id, blocked_user_id: otherUserId },
              { blocker_id: otherUserId, blocked_user_id: user_id },
            ],
          });
          if (isBlocked) {
            return;
          }
        }
      }

      socket.to(chat_id).emit("user_typing", { chat_id, user_id });
    } catch (e) {
      console.error("is_typing error:", e);
    }
  });
};
