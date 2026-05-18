import { model, Schema, Types } from "mongoose";

export interface UserLastSequence {
  user_id: Types.ObjectId;
  last_sequence: number;
}

const userLastSequenceSchema = new Schema<UserLastSequence>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    last_sequence: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const UserLastSequenceModel = model<UserLastSequence>(
  "UserLastSequence",
  userLastSequenceSchema
);