import { MessageReactionModel } from "../models/message_reaction.modal";
import { UserModel } from "../models/user.model";

export interface ReactionSummaryItem {
  emoji: string;
  count: number;
  users: { user_id: string; name: string }[];
}

/**
 * Toggle a reaction on a message.
 *
 * - Same emoji as existing → remove reaction (returns `removed: true`).
 * - Different emoji from existing → update reaction.
 * - No existing reaction → create new reaction.
 *
 * Returns the full aggregated reaction list for the message.
 */
const toggleReaction = async (
  userId: string,
  messageId: string,
  chatId: string,
  emoji: string,
) => {
  const existing = await MessageReactionModel.findOne({
    message_id: messageId,
    user_id: userId,
  });

  let removed = false;

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji → remove the reaction
      await existing.deleteOne();
      removed = true;
    } else {
      // Different emoji → update
      existing.emoji = emoji;
      await existing.save();
    }
  } else {
    // No existing reaction → create
    await MessageReactionModel.create({
      message_id: messageId,
      chat_id: chatId,
      user_id: userId,
      emoji,
    });
  }

  // Build aggregated summary for this message
  const summary = await getReactionSummary(messageId);

  return { removed, summary };
};

/**
 * Aggregate all reactions for a single message into a summary list.
 */
const getReactionSummary = async (
  messageId: string,
): Promise<ReactionSummaryItem[]> => {
  const reactions = await MessageReactionModel.find({
    message_id: messageId,
  }).lean();

  if (reactions.length === 0) return [];

  // Fetch user names in bulk
  const userIds = [...new Set(reactions.map((r) => r.user_id.toString()))];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("_id name")
    .lean();

  const userMap = new Map<string, string>();
  for (const u of users) {
    userMap.set(u._id.toString(), u.name);
  }

  // Group by emoji
  const emojiMap = new Map<
    string,
    { user_id: string; name: string }[]
  >();

  for (const r of reactions) {
    const uid = r.user_id.toString();
    const entry = { user_id: uid, name: userMap.get(uid) || "" };

    if (!emojiMap.has(r.emoji)) {
      emojiMap.set(r.emoji, []);
    }
    emojiMap.get(r.emoji)!.push(entry);
  }

  const summary: ReactionSummaryItem[] = [];
  for (const [emoji, reactionUsers] of emojiMap) {
    summary.push({
      emoji,
      count: reactionUsers.length,
      users: reactionUsers,
    });
  }

  return summary;
};

export const reactionService = {
  toggleReaction,
  getReactionSummary,
};

