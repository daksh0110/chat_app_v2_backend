import { Socket } from "socket.io";
import { io } from "./socket.connection";
import { chatService } from "../services/chat.service";

export const createGroupChat = (socket: Socket, userId: string) => {
  socket.on("create-group", async (data, callback) => {
    try {
      const { name, media, bio, userIds = [] } = data;
      const { groupData, eventPayload, participants } = await chatService.createGroup(
        userId,
        { name, media, bio, userIds },
      );

      const emittedData = { ...groupData, sequence: eventPayload.sequence };

      for (const participant of participants) {
        io.in(participant.user_id._id.toString()).socketsJoin(groupData.chat_id);
      }
      io.to(userIds.map((id: string) => id)).emit("group-created", emittedData);

      callback({ success: true, message: "Group created successfully", ...emittedData });
    } catch (error) {
      console.error(error);

      callback({
        success: false,
        message: "Failed to create group",
      });
    }
  });
};
