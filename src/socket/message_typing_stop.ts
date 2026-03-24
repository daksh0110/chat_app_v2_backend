import { Socket } from "socket.io";

export const messageTypingStop = (socket: Socket, userId: string) => {
  socket.on("stop_typing", (data) => {
    const receiver_id = data.reciever_id;
    socket.to(receiver_id).emit("user_stop_typing", userId);
  });
};
