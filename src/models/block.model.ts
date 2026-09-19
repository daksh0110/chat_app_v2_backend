import { model, Schema, Types } from "mongoose";

export interface IBlock {
  blocker_id: Types.ObjectId;
  blocked_user_id: Types.ObjectId;
}

const blockSchema = new Schema<IBlock>(
  {
    blocker_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    blocked_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

blockSchema.index({ blocker_id: 1, blocked_user_id: 1 }, { unique: true });

export const BlockModel = model<IBlock>("Block", blockSchema);
