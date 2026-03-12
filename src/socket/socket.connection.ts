import { Server, Socket } from "socket.io";
import app from "../app";
import http from "http";
import sendMessageSocket from "./socket.send_message";
import { verifyToken } from "../util/jwt";
import { checkUserStatus } from "./user_status_check";
import { messageDelivered } from "./message_delivered";

export const server = http.createServer(app);

export const io = new Server(server);

export const onlineUsers = new Map<string, string>();

const socketConnection = () => {
  io.on("connection", (socket: Socket) => {
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
    } catch (error) {
      console.log("❌ Invalid token");
      socket.disconnect();
    }
  });
};

export default socketConnection;
