import createHttpError from "http-errors";
import { verifyToken } from "../util/jwt";
import mongoose from "mongoose";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { ChatMemberModel, ROLE } from "../models/chat_group_member.modal";
import { MediaModel } from "../models/media_modal";
import { Types } from "mongoose";
import { createChatEvent } from "./event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";
import { UserModel } from "../models/user.model";
import { sendNotification } from "./notification.service";

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
    ChatGroupModel.findById(id).populate("media").lean(),

    ChatMemberModel.find({
      chat_id: id,
      is_active: true,
    })
      .populate<{
        user_id: {
          _id: mongoose.Types.ObjectId;
          name: string;
          profile_picture?: string;
          email: string;
          bio: string;
          media?: {
            _id: mongoose.Types.ObjectId;
            location?: string;
            url?: string;
          };
        };
      }>({
        path: "user_id",
        select: "name profile_picture media email bio",
        populate: {
          path: "media",
        },
      })
      .lean(),
  ]);

  if (!group) {
    throw createHttpError(404, { message: "Group not found" });
  }

  const participantsData = participants.map((p) => ({
    user_id: p.user_id._id.toString(),
    role: p.role,
    name: p.user_id.name,
    chat_id: p.chat_id,
    media: p.user_id.media,
    email: p.user_id.email,
    bio: p.user_id.bio,
  }));

  const chatData = {
    chat_id: group._id.toString(),
    name:
      group.type === CHAT_TYPE.DIRECT
        ? (participantsData.find((p) => p.user_id !== userId)?.name ?? "")
        : (group.name ?? ""),
    bio: group.type === CHAT_TYPE.GROUP ? (group.bio ?? "") : "",
    type: group.type,
    participants: participantsData,
    media: group.media,
  };

  return {
    success: true,
    message: "Chat Meta data fetched successfully",
    ...chatData,
  };
};

const createGroup = async (
  creatorId: string,
  {
    name,
    media,
    bio,
    userIds = [],
  }: { name?: string; media?: any; bio?: string; userIds?: string[] },
) => {
  const newChat = await ChatGroupModel.create({
    created_by: creatorId,
    bio: bio,
    name,
    type: CHAT_TYPE.GROUP,
  });

  const chatId = newChat._id.toString();

  const members = [
    {
      user_id: new Types.ObjectId(creatorId),
      role: ROLE.ADMIN,
    },
    ...userIds.map((id: string) => ({
      user_id: new Types.ObjectId(id),
      role: ROLE.MEMBER,
    })),
  ];

  const uniqueMembers = Array.from(
    new Map(members.map((m) => [m.user_id.toString(), m])).values(),
  );

  const operations = uniqueMembers.map((member) => ({
    insertOne: {
      document: {
        chat_id: chatId,
        user_id: member.user_id,
        role: member.role,
        is_active: true,
      },
    },
  }));

  await ChatMemberModel.bulkWrite(operations);

  const participants = await ChatMemberModel.find({ chat_id: chatId })
    .populate<{
      user_id: { _id: Types.ObjectId; name: string; profilePic?: string };
    }>("user_id", "name profilePic")
    .lean();

  if (media) {
    const mediaDoc = await MediaModel.create({
      actor_id: chatId,
      content_type: media.content_type,
      key: media.key,
      name: media.name,
      type: media.type,
    });
    await ChatGroupModel.findByIdAndUpdate(chatId, { media: mediaDoc._id });
  }

  const groupData = {
    chat_id: chatId,
    name: newChat.name,
    profile_pic_url: newChat.image,
    bio: newChat.bio,
    type: newChat.type,
    participants: participants.map((p) => ({
      user_id: p.user_id._id.toString(),
      role: p.role,
      name: p.user_id.name,
      profile_pic_url: p.user_id.profilePic,
      chat_id: p.chat_id,
    })),
    media,
  };

  const eventPayload = await createChatEvent({
    chat_id: chatId,
    actor_id: creatorId,
    event: CHAT_EVENT.GROUP_CREATED,
    payload: groupData,
  });

  // Send FCM notifications to participants (excluding creator)
  (async () => {
    try {
      const creator = await UserModel.findById(creatorId).select("name").lean();
      if (!creator) return;

      const recipientUserIds = participants
        .map((p) => p.user_id._id || p.user_id)
        .filter((id) => id.toString() !== creatorId);

      const recipients = await UserModel.find({
        _id: { $in: recipientUserIds },
        fcm_token: { $ne: null, $exists: true },
      })
        .select("fcm_token")
        .lean();

      if (!recipients.length) return;

      const title = newChat.name ?? "New Group";
      const body = `${creator.name} added you to ${title}`;

      const data: Record<string, string> = {
        chat_id: chatId.toString(),
        event: CHAT_EVENT.GROUP_CREATED,
      } as any;

      await Promise.allSettled(
        recipients.map((r) => {
          if (!r.fcm_token) return Promise.resolve();
          return sendNotification({
            token: r.fcm_token,
            title,
            body,
            data,
          }).catch((err) => {
            console.error(
              `[FCM] Failed to send group-created notification to token ${r.fcm_token}:`,
              err?.message ?? err,
            );
          });
        }),
      );
    } catch (err) {
      console.error("[FCM] Group-created notification error:", err);
    }
  })();

  return { groupData, eventPayload, participants };
};

export const chatService = {
  getChatById,
  createGroup,
};
