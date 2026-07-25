import { Socket } from "socket.io";
import { UserLastSequenceModel } from "../models/user_last_sequence";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { ChatEventModel, CHAT_EVENT } from "../models/chat_events_modal";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { Types } from "mongoose";

export const syncChats = async (socket: Socket, userId: string) => {
  socket.on("chat_sync", async () => {
    try {
      const userSeq = await UserLastSequenceModel.findOne({ user_id: userId });
      const last_sequence = userSeq?.last_sequence || 0;

      const chatMembers = await ChatMemberModel.find({
        user_id: userId,
        is_active: true,
      });
      const chatIds = chatMembers.map((cm) => cm.chat_id);

      const missedEvents = await ChatEventModel.find({
        sequence: { $gt: last_sequence },
        $or: [{ chat_id: { $in: chatIds } }, { is_global: true }],
      }).sort({ sequence: 1 });

      for (const event of missedEvents) {
        const payloadWithSeq = { ...event.payload, sequence: event.sequence };

        switch (event.event) {
          case CHAT_EVENT.MESSAGE_SENT:
            socket.emit("receive_message", payloadWithSeq);
            break;
          case CHAT_EVENT.MESSAGE_DELIVERED:
            socket.emit("message_delivered", payloadWithSeq);
            break;
          case CHAT_EVENT.MESSAGE_READ:
            socket.emit("message_read", payloadWithSeq);
            break;
          case CHAT_EVENT.GROUP_CREATED:
            socket.emit("group-created", payloadWithSeq);
            break;
          case CHAT_EVENT.USER_DETAIL_EVENT:
            socket.emit("user-info-updated", payloadWithSeq);
            break;
        }
      }

      const groups = await ChatGroupModel.find({
        _id: {
          $in: chatIds,
        },
        type: CHAT_TYPE.GROUP,
      }).lean();

      for (const group of groups) {
        const participants = await ChatMemberModel.find({
          chat_id: group._id,
          is_active: true,
        })
          .populate<{
            user_id: {
              _id: Types.ObjectId;
              name: string;
              profilePic?: string;
            };
          }>("user_id", "name profilePic")
          .lean();

        const groupData = {
          chat_id: group._id.toString(),
          name: group.name,
          profile_pic_url: group.image,
          description: group.bio,
          type: group.type,
          participants: participants.map((p) => ({
            user_id: p.user_id._id.toString(),
            role: p.role,
            name: p.user_id.name,
            profile_pic_url: p.user_id.profilePic,
            chat_id: p.chat_id,
          })),
        };

        socket.emit("group-sync", groupData);
      }
    } catch (error) {
      console.error("Failed to sync chats:", error);
      socket.emit("chat_sync_error", {
        message: "Failed to sync chats",
      });
    }
  });

  socket.on("chat_event_ack", async (data) => {
    try {
      const { sequence } = data;
      if (typeof sequence === "number") {
        await UserLastSequenceModel.findOneAndUpdate(
          { user_id: userId },
          { $max: { last_sequence: sequence } },
          { upsert: true },
        );
      }
    } catch (error) {
      console.error("chat_event_ack error:", error);
    }
  });
};
