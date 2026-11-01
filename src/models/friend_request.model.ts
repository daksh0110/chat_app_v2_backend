import { model, Schema, Types } from "mongoose";

export enum FRIENDSHIP_STATUS {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  PENDING_INCOMING = "PENDING_INCOMING",
  PENDING_OUTCOMING = "PENDING_OUTCOMING",
}

export interface IFriendship {
  requester_id: Types.ObjectId;
  recipient_id: Types.ObjectId;
  status: FRIENDSHIP_STATUS;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requester_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(FRIENDSHIP_STATUS),
      default: FRIENDSHIP_STATUS.PENDING,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

friendshipSchema.index({ requester_id: 1, recipient_id: 1 }, { unique: true });

export const FriendshipModel = model<IFriendship>(
  "Friendship",
  friendshipSchema,
);
