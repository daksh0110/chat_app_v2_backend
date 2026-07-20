import { Socket } from "socket.io";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { ChatMemberModel, ROLE } from "../models/chat_group_member.modal";
import { Types } from "mongoose";
import { io } from "./socket.connection";
import { createChatEvent } from "../services/event.service";
import { CHAT_EVENT } from "../models/chat_events_modal";
import { MediaModel } from "../models/media_modal";

export const createGroupChat = (socket: Socket, userId: string) => {
  socket.on("create-group", async (data, callback) => {
    try {
      const { name, description, media, userIds = [] } = data;

      const newChat = await ChatGroupModel.create({
        created_by: userId,
        description,
        name,
        type: CHAT_TYPE.GROUP,
      });

      const chatId = newChat._id.toString();

      const members = [
        {
          user_id: new Types.ObjectId(userId),
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
        description: newChat.description,
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
        actor_id: userId,
        event: CHAT_EVENT.GROUP_CREATED,
        payload: groupData,
      });

      const emittedData = { ...groupData, sequence: eventPayload.sequence };

      for (const participant of participants) {
        io.in(participant.user_id._id.toString()).socketsJoin(chatId);
      }
      io.to(userIds.map((id: string) => id)).emit("group-created", emittedData);
      callback({
        success: true,
        message: "Group created successfully",
        ...emittedData,
      });
    } catch (error) {
      console.error(error);

      callback({
        success: false,
        message: "Failed to create group",
      });
    }
  });
};
