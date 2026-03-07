import { Socket } from "socket.io";
import { MessageModel } from "../models/message.modal";

const sendMessageSocket = (socket: Socket, userId: string) => {
  socket.on("send_message", async (data) => {
    try {
      const { message, receiver_id } = data;

      const messageDb = await MessageModel.create({
        message,
        receiver_id,
        sender_id: userId,
      });

      socket.to(receiver_id).emit("receive_message", {
        id: messageDb._id,
        message: messageDb.message,
        sender_id: messageDb.sender_id,
        receiver_id: messageDb.receiver_id,
        created_at: messageDb.createdAt?.getTime(),
      });
    } catch (error) {
      console.error("Send message error:", error);
    }
  });
};

export default sendMessageSocket;
