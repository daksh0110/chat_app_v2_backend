import { Socket } from "socket.io";
import { MessageModel } from "../models/message.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";

export const sendMessageSocket = (socket: Socket, userId: string) => {
  socket.on("send_message", async (data) => {
    try {
      const { message, receiver_id, temp_id } = data;

      const senderChats = await ChatMemberModel.find({
        user_id: userId,
        is_active: true,
      }).select("chat_id");

      let chat = await ChatMemberModel.findOne({
        chat_id: { $in: senderChats.map((c) => c.chat_id) },
        user_id: receiver_id,
        is_active: true,
      });

      let chatId;

      if (!chat) {
        const newChat = await ChatGroupModel.create({
          type: CHAT_TYPE.DIRECT,
        });

        await ChatMemberModel.insertMany([
          { chat_id: newChat._id, user_id: userId },
          { chat_id: newChat._id, user_id: receiver_id },
        ]);

        chatId = newChat._id;
      } else {
        chatId = chat.chat_id;
      }

      const messageDb = await MessageModel.create({
        message,
        sender_id: userId,
        chat_id: chatId,
      });

      socket.emit("message_sent", {
        temp_id,
        message_id: messageDb._id,
      });

      socket.to(receiver_id).emit("receive_message", {
        id: messageDb._id,
        chat_id: chatId,
        message: messageDb.message,
        sender_id: messageDb.sender_id,
        receiver_id: receiver_id,
        created_at: messageDb.createdAt?.getTime(),
      });
    } catch (error) {
      console.error("Send message error:", error);
    }
  });
};
export default sendMessageSocket;
