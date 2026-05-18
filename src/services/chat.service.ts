import createHttpError from "http-errors";
import { verifyToken } from "../util/jwt";
import mongoose from "mongoose";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";

const getChatById = async (id: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, { message: "Invalid chat id" });
  }

  const isMember = await ChatMemberModel.exists({
    chat_id: id,
    user_id: userId,
  });

  if (!isMember) {
    throw createHttpError(403, { message: "Access denied" });
  }

  const [group, participants] = await Promise.all([
    ChatGroupModel.findById(id).lean(),
    ChatMemberModel.find({ chat_id: id, is_active: true })
      .populate<{
        user_id: {
          _id: mongoose.Types.ObjectId;
          name: string;
          profilePic?: string;
        };
      }>("user_id", "name profilePic")
      .lean(),
  ]);

  if (!group) {
    throw createHttpError(404, { message: "Group not found" });
  }

  const participantsData = participants.map((p) => ({
    user_id: p.user_id._id.toString(),
    role: p.role,
    name: p.user_id.name,
    profile_pic_url: p.user_id.profilePic,
    chat_id: p.chat_id,
  }));

  const chatData = {
    chat_id: group._id.toString(),
    name:
      group.type === CHAT_TYPE.DIRECT
        ? (participantsData.find((p) => p.user_id !== userId)?.name ?? "")
        : (group.name ?? ""),
    profile_pic_url:
      group.type === CHAT_TYPE.GROUP
        ? (group.image ?? "")
        : (participantsData.find((p) => p.user_id !== userId)
            ?.profile_pic_url ?? ""),
    description:
      group.type === CHAT_TYPE.GROUP ? (group.description ?? "") : "",
    type: group.type,
    participants: participantsData,
  };

  return {
    success: true,
    message: "Chat Meta data fetched successfully",
    ...chatData,
  };
};

export const chatService = {
  getChatById,
};
