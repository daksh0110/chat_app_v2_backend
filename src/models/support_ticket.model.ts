import { model, Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  created_at: Date;
  updated_at: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const SupportTicketModel = model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema,
);

