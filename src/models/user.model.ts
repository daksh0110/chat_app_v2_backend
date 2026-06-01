import { model, Schema, Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  is_verified: boolean;
  is_activated: boolean;
  bio: string;
  profile_picture: string;
  fcm_token?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    is_verified: { type: Boolean, required: false, default: false },
    is_activated: { type: Boolean, required: false, default: false },
    bio: { type: String, required: false, default: "" },
    profile_picture: { type: String, required: false, default: "" },
    fcm_token: { type: String, required: false, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const UserModel = model<IUser>("User", userSchema);
