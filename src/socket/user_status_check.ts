import { Socket } from "socket.io";
import { onlineUsers } from "./socket.connection";

export const checkUserStatus = (socket: Socket) => {
  socket.on("check_user_status", ({ userId }) => {
    const isOnline = onlineUsers.has(userId);

    socket.emit("user_status", {
      userId,
      online: isOnline,
    });
  });
};
