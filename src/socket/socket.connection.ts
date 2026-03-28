import { Server, Socket } from "socket.io";
import app from "../app";
import http from "http";
import sendMessageSocket from "./socket.send_message";
import { verifyToken } from "../util/jwt";
import { checkUserStatus } from "./user_status_check";
import { messageDelivered } from "./message_delivered";
import { messageRead } from "./message_read";
import { syncChats } from "./chats_sync";
import { messageTyping } from "./message_typing";
import { messageTypingStop } from "./message_typing_stop";
import { ChatMemberModel } from "../models/chat_group_member.modal";

export const server = http.createServer(app);

export const io = new Server(server);

export const onlineUsers = new Map<string, string>();

const socketConnection = () => {
  io.on("connection", async (socket: Socket) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const user = verifyToken(token);
      const userId = user.userId;
      socket.data.userId = userId;
      socket.join(userId);
      const userChatIds = await ChatMemberModel.find({
        user_id: userId,
      }).select("chat_id");
      for (const chatid of userChatIds) {
        if (chatid && chatid.chat_id) socket.join(chatid.chat_id.toString());
      }
      onlineUsers.set(userId, socket.id);
      socket.broadcast.emit("user_online", { userId });

      console.log("✅ User connected:", userId);

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", userId);
        onlineUsers.delete(userId);
        socket.broadcast.emit("user_offline", { userId });
      });

      sendMessageSocket(socket, userId);
      checkUserStatus(socket);
      messageDelivered(socket);
      messageRead(socket);
      syncChats(socket, userId);
      messageTyping(socket, userId);
      messageTypingStop(socket, userId);
    } catch (error) {
      console.log("❌ Invalid token");
      socket.disconnect();
    }
  });
};

export default socketConnection;
