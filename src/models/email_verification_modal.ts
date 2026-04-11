import mongoose, { Types } from "mongoose";

export interface IEmailVerification extends Document {
  user_id: Types.ObjectId;
  verification_token: string;
  otp_hash: string;
  expires_at: Date;
  is_verified: boolean;
  attempts: number;
  otp_request_count: number;
  otp_last_request_time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerification = new mongoose.Schema<IEmailVerification>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verification_token: {
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

EmailVerification.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationModal = mongoose.model<IEmailVerification>(
  "EmailVerification",
  EmailVerification,
);
