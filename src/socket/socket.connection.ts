import { Server, Socket } from "socket.io";
import app from "../app";
import http from "http";
import sendMessageSocket from "./socket.send_message";
import { verifyToken } from "../util/jwt";
import { checkUserStatus } from "./user_status_check";
import { messageDelivered } from "./message_delivered";
import { messageRead } from "./message_read";
import { syncChats } from "./chats_sync";
import { messageTyping } from "./message_typing";
import { messageTypingStop } from "./message_typing_stop";
import { userUpdatedSocket } from "./user_updated";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { createGroupChat } from "./create_group_socket";
import { addGroupMember } from "./group/add_member";
import { removeGroupMember } from "./group/remove_member";
import { leaveGroup } from "./group/leave_group";
import { changeMemberRole } from "./group/change_role";
import { updateGroupProfile } from "./group/update_group";
import { BlockModel } from "../models/block.model";
import { messageReactionSocket } from "./socket.reaction";
import { deleteMessageSocket } from "./socket.delete_message";

export const server = http.createServer(app);

export const io = new Server(server);

export const onlineUsers = new Map<string, string>();

const socketConnection = () => {
  io.on("connection", async (socket: Socket) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const user = verifyToken(token);
      const userId = user.userId;
      socket.data.userId = userId;
      socket.join(userId);
      const userChatIds = await ChatMemberModel.find({
        user_id: userId,
        is_active: true,
      }).select("chat_id");
      for (const chatid of userChatIds) {
        if (chatid && chatid.chat_id) socket.join(chatid.chat_id.toString());
      }
      onlineUsers.set(userId, socket.id);

      // Notify non-blocked users that this user came online
      BlockModel.find({
        $or: [{ blocker_id: userId }, { blocked_user_id: userId }],
      })
        .select("blocker_id blocked_user_id")
        .then((blockedDocs) => {
          const blockedSet = new Set<string>();
          for (const doc of blockedDocs) {
            const b1 = doc.blocker_id.toString();
            const b2 = doc.blocked_user_id.toString();
            if (b1 === userId) blockedSet.add(b2);
            else blockedSet.add(b1);
          }
          for (const [onlineId, sockId] of onlineUsers.entries()) {
            if (onlineId !== userId && !blockedSet.has(onlineId)) {
              io.to(sockId).emit("user_online", { userId });
            }
          }
        })
        .catch(() => {
          socket.broadcast.emit("user_online", { userId });
        });

      console.log("✅ User connected:", userId);

      socket.on("disconnect", async () => {
        console.log("❌ Client disconnected:", userId);
        onlineUsers.delete(userId);
        try {
          const blockedDocs = await BlockModel.find({
            $or: [{ blocker_id: userId }, { blocked_user_id: userId }],
          }).select("blocker_id blocked_user_id");

          const blockedSet = new Set<string>();
          for (const doc of blockedDocs) {
            const b1 = doc.blocker_id.toString();
            const b2 = doc.blocked_user_id.toString();
            if (b1 === userId) blockedSet.add(b2);
            else blockedSet.add(b1);
          }
          for (const [onlineId, sockId] of onlineUsers.entries()) {
            if (onlineId !== userId && !blockedSet.has(onlineId)) {
              io.to(sockId).emit("user_offline", { userId });
            }
          }
        } catch {
          socket.broadcast.emit("user_offline", { userId });
        }
      });

      sendMessageSocket(socket, userId);
      checkUserStatus(socket);
      messageDelivered(socket);
      messageRead(socket);
      syncChats(socket, userId);
      messageTyping(socket, userId);
      messageTypingStop(socket, userId);
      userUpdatedSocket(socket);
      createGroupChat(socket, userId);
      addGroupMember(socket, userId);
      removeGroupMember(socket, userId);
      leaveGroup(socket, userId);
      changeMemberRole(socket, userId);
      updateGroupProfile(socket, userId);
      messageReactionSocket(socket, userId);
      deleteMessageSocket(socket, userId);
    } catch (error) {
      console.log("❌ Invalid token");
      socket.disconnect();
    }
  });
};

export default socketConnection;
