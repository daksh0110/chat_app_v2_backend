import createHttpError from "http-errors";
import { BlockModel } from "../models/block.model";
import {
  FRIENDSHIP_STATUS,
  FriendshipModel,
} from "../models/friend_request.model";
import { UserModel } from "../models/user.model";
import { MediaModel } from "../models/media_modal";
import { awsService } from "./aws.service";
import { sendNotification } from "./notification.service";
import { io } from "../socket/socket.connection";

const sendFriendNotification = async ({
  recipientId,
  actorId,
  event,
  body,
}: {
  recipientId: string;
  actorId: string;
  event: "friend_request_received" | "friend_request_accepted";
  body: string;
}) => {
  try {
    const [recipient, actor] = await Promise.all([
      UserModel.findById(recipientId).select("fcm_token").lean(),
      UserModel.findById(actorId).select("name profile_picture media").lean(),
    ]);

    if (!recipient?.fcm_token || !actor) return;

    let profilePictureUrl = actor.profile_picture || "";
    if (actor.media) {
      const media = await MediaModel.findById(actor.media).select("key").lean();
      if (media?.key) {
        try {
          profilePictureUrl = await awsService.getPresignedUrl(media.key);
        } catch (error) {
          console.error("[FCM] Failed to sign friend avatar URL:", error);
        }
      }
    }

    await sendNotification({
      token: recipient.fcm_token,
      title: actor.name,
      body,
      image: profilePictureUrl || undefined,
      data: {
        type: event,
        user_id: actorId,
        name: actor.name,
        profile_picture_url: profilePictureUrl,
      },
    });
  } catch (error: any) {
    console.error(
      `[FCM] Failed to send ${event} notification:`,
      error?.message ?? error,
    );
  }
};

const sendFriendRequestService = async (
  requesterId: string,
  recipientId: string,
) => {
  if (requesterId === recipientId) {
    throw createHttpError(400, {
      message: "You cannot send a request to yourself",
    });
  }

  const recipient = await UserModel.exists({ _id: recipientId });
  if (!recipient) {
    throw createHttpError(404, { message: "User not found" });
  }

  const isBlocked = await BlockModel.exists({
    blocker_id: recipientId,
    blocked_user_id: requesterId,
  });

  if (isBlocked) {
    return { status: FRIENDSHIP_STATUS.PENDING };
  }

  const existing = await FriendshipModel.findOne({
    $or: [
      { requester_id: requesterId, recipient_id: recipientId },
      { requester_id: recipientId, recipient_id: requesterId },
    ],
  });

  let result;

  if (existing) {
    if (existing.status === FRIENDSHIP_STATUS.REJECTED) {
      existing.requester_id = requesterId as never;
      existing.recipient_id = recipientId as never;
      existing.status = FRIENDSHIP_STATUS.PENDING;
      result = await existing.save();
    } else {
      throw createHttpError(409, {
        message: "A request or friendship already exists",
      });
    }
  } else {
    result = await FriendshipModel.create({
      requester_id: requesterId,
      recipient_id: recipientId,
      status: FRIENDSHIP_STATUS.PENDING,
    });
  }

  io.to(recipientId).emit("friend_request_received", {
    requester_id: requesterId,
  });

  void sendFriendNotification({
    recipientId,
    actorId: requesterId,
    event: "friend_request_received",
    body: "sent you a friend request",
  });

  return result;
};

const removeFriendService = async (userId: string, targetUserId: string) => {
  const result = await FriendshipModel.deleteOne({
    $or: [
      { requester_id: userId, recipient_id: targetUserId },
      { requester_id: targetUserId, recipient_id: userId },
    ],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  });

  if (!result.deletedCount) {
    throw createHttpError(404, { message: "Friendship not found" });
  }
  io.to(targetUserId).emit("friend_removed", {
    remover_id: userId,
  });
};

const cancelFriendRequestService = async (
  requesterId: string,
  recipientId: string,
) => {
  const result = await FriendshipModel.deleteOne({
    requester_id: requesterId,
    recipient_id: recipientId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!result.deletedCount) {
    throw createHttpError(404, { message: "Friend request not found" });
  }

  io.to(recipientId).emit("friend_request_cancelled", {
    requester_id: requesterId,
  });
};

const blockUserService = async (userId: string, targetUserId: string) => {
  if (userId === targetUserId) {
    throw createHttpError(400, {
      message: "You cannot block yourself",
    });
  }

  const targetUser = await UserModel.exists({
    _id: targetUserId,
  });

  if (!targetUser) {
    throw createHttpError(404, {
      message: "User not found",
    });
  }

  await BlockModel.findOneAndUpdate(
    {
      blocker_id: userId,
      blocked_user_id: targetUserId,
    },
    {
      $setOnInsert: {
        blocker_id: userId,
        blocked_user_id: targetUserId,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  // Clean up any existing friendship or pending requests between the two
  await FriendshipModel.deleteMany({
    $or: [
      { requester_id: userId, recipient_id: targetUserId },
      { requester_id: targetUserId, recipient_id: userId },
    ],
  });

  return;
};

const unblockUserService = async (userId: string, targetUserId: string) => {
  const result = await BlockModel.deleteOne({
    blocker_id: userId,
    blocked_user_id: targetUserId,
  });

  if (!result.deletedCount) {
    throw createHttpError(404, { message: "User is not blocked" });
  }
};

const isUserBlockedService = async (
  blockerId: string,
  blockedUserId: string,
) => {
  return Boolean(
    await BlockModel.exists({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
    }),
  );
};

const getBlockedUserIdsService = async (userId: string) => {
  return BlockModel.distinct("blocked_user_id", {
    blocker_id: userId,
  });
};

const getAllBlockedUserIdsForSearch = async (userId: string) => {
  const [blockedByMe, blockedMe] = await Promise.all([
    BlockModel.distinct("blocked_user_id", { blocker_id: userId }),
    BlockModel.distinct("blocker_id", { blocked_user_id: userId }),
  ]);
  return [
    ...new Set([
      ...blockedByMe.map((id) => id.toString()),
      ...blockedMe.map((id) => id.toString()),
    ]),
  ];
};

const getFriendRequestsService = async (userId: string) => {
  const friendships = await FriendshipModel.find({
    recipient_id: userId,
    status: FRIENDSHIP_STATUS.PENDING,
  })
    .populate("requester_id", "name email bio profile_picture media")
    .lean();

  return friendships.map((f) => {
    const requester = f.requester_id as any;
    return {
      _id: requester._id,
      name: requester.name,
      email: requester.email,
      bio: requester.bio,
      profile_picture: requester.profile_picture,
      media: requester.media,
    };
  });
};

const getFriendsListService = async (userId: string) => {
  const friendships = await FriendshipModel.find({
    $or: [{ requester_id: userId }, { recipient_id: userId }],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  })
    .populate("requester_id", "name email bio profile_picture media")
    .populate("recipient_id", "name email bio profile_picture media")
    .lean();

  return friendships.map((f) => {
    const requester = f.requester_id as any;
    const recipient = f.recipient_id as any;
    const other = requester._id.toString() === userId ? recipient : requester;
    return {
      _id: other._id,
      name: other.name,
      email: other.email,
      bio: other.bio,
      profile_picture: other.profile_picture,
      media: other.media,
    };
  });
};

const getAllRelationshipsService = async (userId: string) => {
  const friendships = await FriendshipModel.find({
    $or: [{ requester_id: userId }, { recipient_id: userId }],
    status: {
      $in: [FRIENDSHIP_STATUS.ACCEPTED, FRIENDSHIP_STATUS.PENDING],
    },
  })
    .populate("requester_id", "name email bio profile_picture media")
    .populate("recipient_id", "name email bio profile_picture media")
    .lean();

  const results: Array<{
    _id: string;
    status:
      | "FRIENDS"
      | "PENDING_INCOMING"
      | "PENDING_OUTGOING"
      | "PENDING_OUTCOMING"
      | "BLOCKED";
    name: string;
    email?: string;
    bio?: string;
    profile_picture?: string;
    media?: any;
  }> = [];

  for (const f of friendships) {
    const requester = f.requester_id as any;
    const recipient = f.recipient_id as any;
    if (!requester || !recipient) continue;

    const isRequester = requester._id.toString() === userId;
    const otherUser = isRequester ? recipient : requester;

    let relStatus:
      | "FRIENDS"
      | "PENDING_INCOMING"
      | "PENDING_OUTGOING"
      | "PENDING_OUTCOMING" = "FRIENDS";
    if (f.status === FRIENDSHIP_STATUS.ACCEPTED) {
      relStatus = "FRIENDS";
    } else if (f.status === FRIENDSHIP_STATUS.PENDING) {
      relStatus = isRequester
        ? FRIENDSHIP_STATUS.PENDING_OUTGOING
        : FRIENDSHIP_STATUS.PENDING_INCOMING;
    }

    results.push({
      _id: otherUser._id.toString(),
      status: relStatus,
      name: otherUser.name,
      email: otherUser.email,
      bio: otherUser.bio,
      profile_picture: otherUser.profile_picture,
      media: otherUser.media,
    });
  }

  const blocks = await BlockModel.find({ blocker_id: userId })
    .populate("blocked_user_id", "name email bio profile_picture media")
    .lean();

  for (const b of blocks) {
    const blockedUser = b.blocked_user_id as any;
    if (!blockedUser) continue;

    results.push({
      _id: blockedUser._id.toString(),
      status: "BLOCKED",
      name: blockedUser.name,
      email: blockedUser.email,
      bio: blockedUser.bio,
      profile_picture: blockedUser.profile_picture,
      media: blockedUser.media,
    });
  }

  return results;
};

const acceptFriendRequestService = async (
  requesterId: string,
  currentUserId: string,
) => {
  const friendship = await FriendshipModel.findOne({
    requester_id: requesterId,
    recipient_id: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!friendship) {
    throw createHttpError(404, { message: "Friend request not found" });
  }

  friendship.status = FRIENDSHIP_STATUS.ACCEPTED;
  const result = await friendship.save();

  io.to(requesterId).emit("friend_request_accepted", {
    accepter_id: currentUserId,
  });

  void sendFriendNotification({
    recipientId: requesterId,
    actorId: currentUserId,
    event: "friend_request_accepted",
    body: "accepted your friend request",
  });

  return result;
};

const rejectFriendRequestService = async (
  requesterId: string,
  currentUserId: string,
) => {
  const friendship = await FriendshipModel.findOne({
    requester_id: requesterId,
    recipient_id: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!friendship) {
    throw createHttpError(404, { message: "Friend request not found" });
  }

  friendship.status = FRIENDSHIP_STATUS.REJECTED;
  const result = await friendship.save();

  io.to(requesterId).emit("friend_request_rejected", {
    rejecter_id: currentUserId,
  });

  return result;
};

export const requestService = {
  sendFriendRequestService,
  removeFriendService,
  cancelFriendRequestService,
  blockUserService,
  unblockUserService,
  isUserBlockedService,
  getBlockedUserIdsService,
  getAllBlockedUserIdsForSearch,
  getFriendRequestsService,
  getFriendsListService,
  getAllRelationshipsService,
  acceptFriendRequestService,
  rejectFriendRequestService,
};
