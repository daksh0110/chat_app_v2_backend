import { Socket } from "socket.io";

export const messageTyping = (socket: Socket, user_id: string) => {
  socket.on("is_typing", (data) => {
    const receiver_id = data.receiver_id;
    socket.to(receiver_id).emit("user_typing", user_id);
  });
};
