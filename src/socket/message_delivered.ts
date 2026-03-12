import { Socket } from "socket.io";

export const messageDelivered = (socket: Socket) => {
  socket.on("message_delivered", ({ message_id, sender_id }) => {
    socket.to(sender_id).emit("message_delivered", {
      message_id,
    });
  });
};
