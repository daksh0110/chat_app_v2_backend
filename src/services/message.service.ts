import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { MessageModel, MessageStatus } from "../models/message.modal";
import { MessageStatusModel } from "../models/message_status_modal";

const findOrCreateChatId = async (userId: string, receiverId: string) => {
  const myChats = await ChatMemberModel.find({
    user_id: userId,
    is_active: true,
  }).select("chat_id");

  const myChatIds = myChats.map((c) => c.chat_id.toString());

  const receiverChats = await ChatMemberModel.find({
    user_id: receiverId,
    is_active: true,
  }).select("chat_id");

  const receiverChatIds = receiverChats.map((c) => c.chat_id.toString());

  const commonChatIds = myChatIds.filter((id) => receiverChatIds.includes(id));

  let chat = await ChatGroupModel.findOne({
    _id: { $in: commonChatIds },
    type: CHAT_TYPE.DIRECT,
  });

  if (!chat) {
    chat = await ChatGroupModel.create({
      type: CHAT_TYPE.DIRECT,
    });

    await ChatMemberModel.insertMany([
      {
        chat_id: chat._id,
        user_id: userId,
      },
      {
        chat_id: chat._id,
        user_id: receiverId,
      },
    ]);
  }

  return chat._id;
};

const createMessage = async (
  senderId: string,
  chatId: string,
  message: string,
  tempId?: string,
) => {
  const messageDb = await MessageModel.create({
    message,
    sender_id: senderId,
    chat_id: chatId,
  });
  const chatParticipants = await ChatMemberModel.find({
    chat_id: chatId,
    is_active: true,
  }).select("user_id");
  const messageStatuses = chatParticipants
    .filter((p) => p.user_id.toString() !== senderId)
    .map((p) => ({
      message_id: messageDb._id,
      user_id: p.user_id,
      status: MessageStatus.SENT,
    }));
  const messageStatusDocs =
    await MessageStatusModel.insertMany(messageStatuses);
  const payload = {
    temp_id: tempId,
    message_id: messageDb._id.toString(),
    chat_id: chatId.toString(),
    message: messageDb.message,
    sender_id: messageDb.sender_id.toString(),
    created_at: messageDb.createdAt?.getTime() ?? null,
    message_statuses: messageStatusDocs.map((ms) => ({
      message_id: ms.message_id.toString(),
      user_id: ms.user_id.toString(),
      status: ms.status,
      delivered_at: ms.delivered_at?.getTime() ?? null,
      read_at: ms.read_at?.getTime() ?? null,
      created_at: ms.created_at?.getTime() ?? null,
      updated_at: ms.updated_at?.getTime() ?? null,
    })),
  };
  return payload;
};

export const messageService = {
  findOrCreateChatId,
  createMessage,
};
