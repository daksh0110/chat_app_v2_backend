import { Server, Socket } from "socket.io";
import app from "../app";
import http from "http";
import sendMessageSocket from "./socket.send_message";
import { verifyToken } from "../util/jwt";

export const server = http.createServer(app);

export const io = new Server(server);

const socketConnection = () => {
  io.on("connection", (socket: Socket) => {
    try {
      console.log(socket.handshake.auth);
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const user = verifyToken(token);

      socket.data.userId = user.userId;

      socket.join(user.userId);

      console.log("✅ User connected:", user.userId);

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", user.userId);
      });

      sendMessageSocket(socket);
    } catch (error) {
      console.log("❌ Invalid token");
      socket.disconnect();
    }
  });
};

export default socketConnection;
