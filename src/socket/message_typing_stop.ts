import { Socket } from "socket.io";

export const messageTypingStop = (socket: Socket, userId: string) => {
  socket.on("stop_typing", (data) => {
    const chat_id = data.chat_id;
    socket.to(chat_id).emit("user_stop_typing", { chat_id, user_id: userId });
  });
};
