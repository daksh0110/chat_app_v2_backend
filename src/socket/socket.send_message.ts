import { Socket } from "socket.io";
import { MessageModel } from "../models/message.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
export const sendMessageSocket = (socket: Socket, userId: string) => {
  socket.on("send_message", async (data, callback) => {
    try {
      const { message, receiver_id, temp_id, chat_id } = data;

      let chatId = chat_id;

      if (!chatId) {
        let chat = await ChatMemberModel.findOne({
          user_id: receiver_id,
          is_active: true,
          chat_id: {
            $in: (
              await ChatMemberModel.find({
                user_id: userId,
                is_active: true,
              }).select("chat_id")
            ).map((c) => c.chat_id),
          },
        });

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
      }

      const messageDb = await MessageModel.create({
        message,
        sender_id: userId,
        chat_id: chatId,
      });

      const payload = {
        temp_id,
        message_id: messageDb._id.toString(),
        chat_id: chatId.toString(),
        message: messageDb.message,
        sender_id: messageDb.sender_id.toString(),
        created_at: messageDb.createdAt?.getTime(),
      };

      if (callback) {
        callback(payload);
      }

      socket.emit("receive_message", payload);

      socket.to(receiver_id).emit("receive_message", payload);
    } catch (error) {
      console.error("Send message error:", error);

      if (callback) {
        callback({
          error: true,
          message: "Failed to send message",
        });
      }
    }
  });
};
export default sendMessageSocket;
