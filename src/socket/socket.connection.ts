import { Server, Socket } from "socket.io";
import app from "../app";
import http from "http";

export const server = http.createServer(app);

const io = new Server(server);

const socketConnection = () => {
  io.on("connection", (socket: Socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};

export default socketConnection;
