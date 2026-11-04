import { Socket } from "socket.io";
import { io } from "../socket.connection";
import { chatService } from "../../services/chat.service";

export const updateGroupProfile = (socket: Socket, actorId: string) => {
  socket.on("update-group-profile", async (data, callback) => {
    try {
      const { chatId, media, image, name, bio } = data;
      const { payload, eventPayload } = await chatService.updateGroupProfile(
        actorId,
        chatId,
        { media, image, name, bio },
      );
      const emittedData = {
        ...payload,
        sequence: eventPayload ? eventPayload.sequence : undefined,
      };
      io.to(payload.chat_id).emit("group-profile-updated", emittedData);
      if (typeof callback === "function") {
        callback({
          success: true,
          message: "Group profile updated successfully",
          ...emittedData,
        });
      }
    } catch (error: any) {
      console.error("Failed to update group profile:", error);
      if (typeof callback === "function") {
        callback({
          success: false,
          message: error?.message || "Failed to update group profile",
        });
      }
    }
  });
};

