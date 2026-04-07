import mongoose, { Document, Types } from "mongoose";

export interface IPasswordReset extends Document {
  user_id: Types.ObjectId;
  reset_token: string;
  otp_hash: string;
  expires_at: Date;
  is_verified: boolean;
  attempts: number;
  otp_request_count: number;
  otp_last_request_time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetSchema = new mongoose.Schema<IPasswordReset>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reset_token: {
      type: String,
      required: true,
      unique: true,
    },

    otp_hash: {
      type: String,
      required: true,
    },

    expires_at: {
      type: Date,
      required: true,
    },

    is_verified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    otp_request_count: {
      type: Number,
      default: 0,
    },

    otp_last_request_time: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = mongoose.model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema,
);
