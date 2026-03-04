import { Socket } from "socket.io";

const sendMessageSocket = (socket: Socket) => {
  socket.on("send_message", (data) => {
    const { message, receiver_id } = data;

    socket.to(receiver_id).emit("receive_message", message);
  });
};

export default sendMessageSocket;
