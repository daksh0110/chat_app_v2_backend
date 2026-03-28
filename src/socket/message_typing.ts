import { Socket } from "socket.io";

export const messageTyping = (socket: Socket, user_id: string) => {
  socket.on("is_typing", (data) => {
    const chat_id = data.chat_id;
    socket.to(chat_id).emit("user_typing", { chat_id, user_id });
  });
};
