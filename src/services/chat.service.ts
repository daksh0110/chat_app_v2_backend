import createHttpError from "http-errors";
import { verifyToken } from "../util/jwt";
import mongoose from "mongoose";
import { ChatGroupModel } from "../models/chat_group.modal";
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
  const groupData = {
    chat_id: group._id.toString(),
    name: group.name,
    profile_pic_url: group.image,
    description: group.description,
    type: group.type,
    participants: participants.map((p) => ({
      user_id: p._id.toString(),
      role: p.role,
      name: p.user_id.name,
      profile_pic_url: p.user_id.profilePic,
      chat_id: p.chat_id,
    })),
  };
  return {
    success: true,
    message: "Group chat fetched successfully",
    ...groupData,
  };
};

export const chatService = {
  getChatById,
};
