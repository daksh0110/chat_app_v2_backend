import { CHAT_TYPE, ChatGroupModel } from "../models/chat_group.modal";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { MediaModel } from "../models/media_modal";
import { IReplyTo, MessageModel, MessageStatus } from "../models/message.modal";
import { MessageStatusModel } from "../models/message_status_modal";
import { UserModel } from "../models/user.model";
import { BlockModel } from "../models/block.model";
import { awsService } from "./aws.service";
import { sendNotification } from "./notification.service";
import { Types } from "mongoose";

const findOrCreateChatId = async (userId: string, receiverId: string) => {
  const myChats = await ChatMemberModel.find({
    user_id: userId,
    is_active: true,
  }).select("chat_id");

  const myChatIds = myChats.map((c) => c.chat_id.toString());

  const receiverChats = await ChatMemberModel.find({
    user_id: receiverId,
    is_active: true,
  }).select("chat_id");

  const receiverChatIds = receiverChats.map((c) => c.chat_id.toString());

  const commonChatIds = myChatIds.filter((id) => receiverChatIds.includes(id));

  let chat = await ChatGroupModel.findOne({
    _id: { $in: commonChatIds },
    type: CHAT_TYPE.DIRECT,
  });

  if (!chat) {
    chat = await ChatGroupModel.create({
      type: CHAT_TYPE.DIRECT,
    });

    await ChatMemberModel.insertMany([
      {
        chat_id: chat._id,
        user_id: userId,
      },
      {
        chat_id: chat._id,
        user_id: receiverId,
      },
    ]);
  }

  return chat._id;
};

const createMessage = async (
  senderId: string,
  chatId: string,
  message: string,
  tempId?: string,
  attachments?: MediaModel[],
  replyTo?: {
    message_id: string;
    sender_id?: string;
    sender_name?: string;
    message?: string;
  },
) => {
  let replyToData: IReplyTo | undefined = undefined;
  if (replyTo?.message_id) {
    let senderName = replyTo.sender_name;
    let replyMsg = replyTo.message;
    let rSenderId = replyTo.sender_id;

    if (!senderName || replyMsg === undefined) {
      const origMsg = await MessageModel.findById(replyTo.message_id).populate("sender_id", "name");
      if (origMsg) {
        if (origMsg.sender_id) {
          rSenderId = (origMsg.sender_id as any)._id?.toString() || origMsg.sender_id.toString();
          senderName = (origMsg.sender_id as any).name || "";
        }
        replyMsg = origMsg.message || "";
      }
    }

    replyToData = {
      message_id: new Types.ObjectId(replyTo.message_id),
      sender_id: rSenderId ? new Types.ObjectId(rSenderId) : undefined,
      sender_name: senderName || "",
      message: replyMsg || "",
    };
  }

  const messageDb = await MessageModel.create({
    message,
    sender_id: senderId,
    chat_id: chatId,
    ...(replyToData ? { reply_to: replyToData } : {}),
  });

  let attachmentPayloads: any[] = [];

  if (attachments?.length) {
    const medias = await MediaModel.insertMany(
      attachments.map((a) => ({
        key: a.key,
        content_type: a.content_type,
        actor_id: messageDb._id,
        actor_type: "message",
        type: a.type,
        name: a.name,
      })),
    );

    messageDb.media = medias.map((m) => m._id);

    await messageDb.save();

    attachmentPayloads = await Promise.all(
      medias.map(async (m) => {
        let url = "";
        try {
          url = await awsService.getPresignedUrl(m.key);
        } catch (e) {
          console.error(
            "Failed to generate presigned GET url for key:",
            m.key,
            e,
          );
        }
        return {
          key: m.key,
          content_type: m.content_type,
          type: m.type,
          name: m.name,
          url,
        };
      }),
    );
  }

  const [chatParticipants, chatGroup] = await Promise.all([
    ChatMemberModel.find({
      chat_id: chatId,
      is_active: true,
    }).select("user_id"),
    ChatGroupModel.findById(chatId).select("name type").lean(),
  ]);

  let isBlockedByRecipient = false;
  let blockedRecipientId: string | null = null;

  if (chatGroup?.type === CHAT_TYPE.DIRECT) {
    const recipientMember = chatParticipants.find(
      (p) => p.user_id.toString() !== senderId,
    );
    if (recipientMember) {
      const recipientId = recipientMember.user_id.toString();
      const blocked = await BlockModel.exists({
        blocker_id: recipientId,
        blocked_user_id: senderId,
      });
      if (blocked) {
        isBlockedByRecipient = true;
        blockedRecipientId = recipientId;
      }
    }
  }

  const messageStatuses = chatParticipants
    .filter((p) => p.user_id.toString() !== senderId)
    .map((p) => ({
      message_id: messageDb._id,
      user_id: p.user_id,
      status: MessageStatus.SENT,
    }));

  const messageStatusDocs = messageStatuses.length
    ? await MessageStatusModel.insertMany(messageStatuses)
    : [];

  const payload = {
    temp_id: tempId,
    message_id: messageDb._id.toString(),
    chat_id: chatId.toString(),
    message: messageDb.message,
    sender_id: messageDb.sender_id.toString(),
    attachments: attachmentPayloads,
    reply_to: replyToData
      ? {
          message_id: replyToData.message_id.toString(),
          sender_id: replyToData.sender_id?.toString() ?? null,
          sender_name: replyToData.sender_name ?? "",
          message: replyToData.message ?? "",
        }
      : null,

    created_at: messageDb.createdAt?.getTime() ?? null,
    message_statuses: messageStatusDocs.map((ms) => ({
      message_id: ms.message_id.toString(),
      user_id: ms.user_id.toString(),
      status: ms.status,
      delivered_at: ms.delivered_at?.getTime() ?? null,
      read_at: ms.read_at?.getTime() ?? null,
      created_at: ms.created_at?.getTime() ?? null,
      updated_at: ms.updated_at?.getTime() ?? null,
    })),
    is_blocked_by_recipient: isBlockedByRecipient,
    blocked_recipient_id: blockedRecipientId,
  };

  (async () => {
    try {
      if (isBlockedByRecipient) return;

      const [sender] = await Promise.all([
        UserModel.findById(senderId).select("name").lean(),
      ]);

      if (!sender || !chatGroup) return;

      const recipientUserIds = chatParticipants
        .filter((p) => p.user_id.toString() !== senderId)
        .map((p) => p.user_id);

      const recipients = await UserModel.find({
        _id: { $in: recipientUserIds },
        fcm_token: { $ne: null, $exists: true },
      })
        .select("fcm_token")
        .lean();

      if (!recipients.length) return;

      const senderName = sender.name;
      let notifTitle: string;
      let notifBody: string;

      const messageText =
        messageDb.message ||
        (attachmentPayloads.length > 0 ? "📎 Attachment" : "");

      if (chatGroup.type === CHAT_TYPE.DIRECT) {
        notifTitle = senderName;
        notifBody = messageText || "Sent an attachment";
      } else {
        notifTitle = chatGroup.name ?? "Group Message";
        notifBody = `${senderName}: ${messageText || "Sent an attachment"}`;
      }

      const notifData: Record<string, string> = {
        chat_id: chatId.toString(),
        message_id: messageDb._id.toString(),
        sender_id: senderId,
        type: chatGroup.type,
      };

      await Promise.allSettled(
        recipients.map((recipient) => {
          if (!recipient.fcm_token) return Promise.resolve();
          return sendNotification({
            token: recipient.fcm_token,
            title: notifTitle,
            body: notifBody,
            data: notifData,
          }).catch((err) => {
            console.error(
              `[FCM] Failed to send notification to token ${recipient.fcm_token}:`,
              err?.message ?? err,
            );
          });
        }),
      );
    } catch (err) {
      console.error("[FCM] Notification dispatch error:", err);
    }
  })();

  return payload;
};

export const messageService = {
  findOrCreateChatId,
  createMessage,
};
