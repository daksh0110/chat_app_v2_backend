import createHttpError from "http-errors";
import { IUser, UserModel } from "../models/user.model";
import { CreateUserDto, loginUserDto, searchUser } from "../types/user.types";
import { comparePassword, encryptpassword } from "../util/bcrypt";
import { createToken, verifyToken } from "../util/jwt";
import { verifyGoogleToken } from "../util/google";
import mongoose, { PipelineStage, QueryFilter, Types } from "mongoose";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { MessageStatus } from "../models/message.modal";
import { emailService } from "./email.service";
import crypto from "crypto";
import { PasswordResetModel } from "../models/password_reset_modal";
import { EmailVerificationModal } from "../models/email_verification_modal";

const createUser = async (data: CreateUserDto) => {
  try {
    const encryptedPassword = encryptpassword(data.password);
    let user = await UserModel.findOne({ email: data.email });

    if (user) {
      throw createHttpError(400, "User with this email already exists");
    } else {
      user = await UserModel.create({
        email: data.email,
        name: data.name,
        password: encryptedPassword,
        is_verified: false,
        is_activated: false,
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = encryptpassword(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await EmailVerificationModal.deleteMany({ user_id: user._id });

    await EmailVerificationModal.create({
      user_id: user._id,
      verification_token: verificationToken,
      otp_hash: otpHash,
      expires_at: expiresAt,
      otp_last_request_time: new Date(),
      otp_request_count: 1,
    });

    if (process.env.IS_LOCAL === "true") {
      console.log("🔐 OTP (DEV ONLY):", otp);
    } else {
      await emailService.sendVerificationEmail({
        email: user.email,
        otp,
      });
    }

    return {
      message: "Otp Sent Successfully",
      skip_otp: false,
      email: user.email,
      verification_token: verificationToken,
    };
  } catch (error: any) {
    throw error;
  }
};

export const verifyEmailOtpService = async ({
  email_verification_token,
  otp,
}: {
  email_verification_token: string;
  otp: string;
}) => {
  const session = await EmailVerificationModal.findOne({
    verification_token: email_verification_token,
  });

  if (!session) {
    throw createHttpError(400, {
      message: "Invalid Email Verification Session",
    });
  }

  if (session.expires_at < new Date()) {
    await EmailVerificationModal.deleteOne({ _id: session._id });

    throw createHttpError(410, {
      message: "OTP has expired. Please request a new one.",
    });
  }

  if (session.attempts >= 5) {
    await EmailVerificationModal.deleteOne({ _id: session._id });

    throw createHttpError(429, {
      message:
        "Too many incorrect attempts. Please request a new OTP after some time",
    });
  }
  const isMatch = await comparePassword({
    dbPassword: session.otp_hash,
    userPassword: otp,
  });

  if (!isMatch) {
    session.attempts += 1;
    await session.save();

    throw createHttpError(400, {
      message: "Invalid OTP",
      remaining_attempts: 5 - session.attempts,
    });
  }

  session.is_verified = true;
  session.attempts = 0;
  await session.save();

  const user = await UserModel.findByIdAndUpdate(session.user_id, {
    $set: { is_verified: true },
  });

  if (!user) {
    throw createHttpError("403", { message: "User does not exist" });
  }
  return { accessToken: createToken(user._id.toString()) };
};

const loginUser = async (data: loginUserDto) => {
  const { email, password } = data;

  const user = await UserModel.findOne({ email: email });

  if (!user) {
    throw createHttpError(400, { message: "User does not exist" });
  }

  const isMatch = await comparePassword({
    dbPassword: user.password,
    userPassword: password,
  });
  if (!isMatch) {
    throw createHttpError(400, { message: "Invalid credentials" });
  }

  if (user.is_verified === false) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = encryptpassword(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await EmailVerificationModal.deleteMany({ user_id: user._id });

    await EmailVerificationModal.create({
      user_id: user._id,
      verification_token: verificationToken,
      otp_hash: otpHash,
      expires_at: expiresAt,
      otp_last_request_time: new Date(),
      otp_request_count: 1,
    });

    if (process.env.IS_LOCAL === "true") {
      console.log("🔐 OTP (DEV ONLY):", otp);
    } else {
      await emailService.sendVerificationEmail({
        email: user.email,
        otp,
      });
    }

    return {
      message: "Otp Sent Successfully",
      skip_otp: false,
      email: user.email,
      verification_token: verificationToken,
    };
  }

  const accessToken = createToken(user._id.toString());

  return {
    accessToken,
    skip_otp: true,
  };
};

const googleauth = async (data: { token: string }) => {
  try {
    const info = await verifyGoogleToken(data.token);
    if (!info) {
      throw createHttpError(400, { message: "Invalid accessToken" });
    }

    const { email, name, picture } = info;

    const user = await UserModel.findOne({
      email: email,
    });
    if (user) {
      const accessToken = createToken(user._id.toString());
      return { accessToken };
    }
    const newUser = await UserModel.create({
      email,
      name,
      is_verified: false,
      profile_picture: picture,
    });
    return {
      name,
      email,
      newUser: true,
      accessToken: null,
      id: newUser._id.toString(),
    };
  } catch (error) {
    console.error("Error in googleauth service:", error);
    throw createHttpError(500, { message: "Internal Server Error" });
  }
};

const getUsers = async (data: searchUser, userId: string) => {
  const page = parseInt(data.page || "1");
  const search = data.search || "";

  const limit = 10;
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IUser> = {
    _id: { $ne: userId },
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await UserModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("name email _id bio profile_picture")
    .lean();
  const processedUsers = users.map((user) => ({
    ...user,
    subtitle: user.email,
  }));
  return processedUsers;
};

const getMyProfile = async (token: string) => {
  const userInfo = verifyToken(token);
  if (!userInfo.userId) {
    throw createHttpError(400, { message: "Invalid accessToken" });
  }

  const user = await UserModel.findById(userInfo.userId)
    .select("name email _id bio profile_picture")
    .lean();

  return user;
};

const getUserById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, { message: "Invalid user id" });
  }

  const user = await UserModel.findById(id)
    .select("name email _id bio profile_picture")
    .lean();

  if (!user) {
    throw createHttpError(404, { message: "User not found" });
  }
  return {
    ...user,
    subtitle: user.email,
  };
};
const getChatsService = async (id: string) => {
  const pipeline: PipelineStage[] = [
    { $match: { user_id: new Types.ObjectId(id) } },

    {
      $lookup: {
        from: "chatmembers",
        localField: "chat_id",
        foreignField: "chat_id",
        as: "chatgroup",
        pipeline: [
          { $match: { user_id: { $ne: new Types.ObjectId(id) } } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "users",
              pipeline: [{ $project: { name: 1, email: 1 } }],
            },
          },
          { $unwind: "$users" },
        ],
      },
    },

    {
      $lookup: {
        from: "messages",
        localField: "chat_id",
        foreignField: "chat_id",
        as: "messages",
        pipeline: [
          { $match: { status: MessageStatus.SENT } },
          { $sort: { createdAt: 1 } },
          {
            $project: {
              id: "$_id",
              chat_id: 1,
              message: 1,
              sender_id: 1,
              status: 1,
              created_at: "$createdAt",
              is_read: { $eq: ["$status", MessageStatus.READ] },
            },
          },
        ],
      },
    },
    { $unwind: "$chatgroup" },

    {
      $project: {
        chat_id: 1,
        user_id: "$chatgroup.users._id",
        name: "$chatgroup.users.name",
        last_message: { $arrayElemAt: ["$messages.message", 0] },
        last_message_time: { $arrayElemAt: ["$messages.created_at", 0] },
        messages: 1,
        un_read_count: {
          $size: {
            $filter: {
              input: "$messages",
              as: "msg",
              cond: {
                $and: [
                  { $ne: ["$$msg.sender_id", new Types.ObjectId(id)] },
                  { $ne: ["$$msg.status", "read"] },
                ],
              },
            },
          },
        },
      },
    },
  ];

  const chats = await ChatMemberModel.aggregate(pipeline);

  const messages: any[] = [];

  chats.forEach((chat) => {
    chat.messages.forEach((msg: any) => {
      messages.push({
        id: msg.id,
        chat_id: chat.chat_id,
        message: msg.message,
        sender_id: msg.sender_id,
        created_at: msg.created_at?.getTime?.() ?? msg.created_at,
      });
    });
  });

  return {
    chats,
    messages,
  };
};

export const sendOtpService = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw createHttpError(400, {
      message: "User with this email does not exist",
    });
  }

  const existing = await PasswordResetModel.findOne({
    user_id: user._id,
  });

  const now = new Date();

  if (existing) {
    const diff =
      now.getTime() - new Date(existing.otp_last_request_time).getTime();

    if (diff < 60 * 1000) {
      throw createHttpError(429, {
        message: "Please wait before requesting another OTP",
      });
    }

    const windowDiff =
      now.getTime() - new Date(existing.otp_last_request_time).getTime();

    if (windowDiff < 60 * 60 * 1000) {
      if (existing.otp_request_count >= 5) {
        throw createHttpError(429, {
          message: "Too many OTP requests. Try again later.",
        });
      }

      existing.otp_request_count += 1;
    } else {
      existing.otp_request_count = 1;
    }

    await PasswordResetModel.deleteOne({ _id: existing._id });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const otp_hash = encryptpassword(otp);

  const reset_token = crypto.randomBytes(32).toString("hex");

  await PasswordResetModel.create({
    user_id: user._id,
    reset_token,
    otp_hash,
    attempts: 0,
    is_verified: false,
    otp_request_count: existing ? existing.otp_request_count : 1,
    otp_last_request_time: now,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
  });

  if (process.env.IS_LOCAL === "true") {
    console.log("🔐 OTP (DEV ONLY):", otp);
  } else {
    await emailService.changePasswordEmail({
      email,
      otp,
    });
  }

  return {
    reset_token,
  };
};

export const verifyOtpService = async ({
  reset_token,
  otp,
}: {
  reset_token: string;
  otp: string;
}) => {
  const session = await PasswordResetModel.findOne({ reset_token });

  if (!session) {
    throw createHttpError(400, {
      message: "Invalid or expired password reset session",
    });
  }

  if (session.expires_at < new Date()) {
    await PasswordResetModel.deleteOne({ _id: session._id });

    throw createHttpError(410, {
      message: "OTP has expired. Please request a new one.",
    });
  }

  if (session.attempts >= 5) {
    await PasswordResetModel.deleteOne({ _id: session._id });

    throw createHttpError(429, {
      message: "Too many incorrect attempts. Please request a new OTP.",
    });
  }
  console.log(otp, session.otp_hash);
  const isMatch = await comparePassword({
    dbPassword: session.otp_hash,
    userPassword: otp,
  });

  if (!isMatch) {
    session.attempts += 1;
    await session.save();

    throw createHttpError(400, {
      message: "Invalid OTP",
      remaining_attempts: 5 - session.attempts,
    });
  }

  session.is_verified = true;
  session.attempts = 0;
  await session.save();

  return;
};

export const sendEmailVerificationOtpService = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw createHttpError(400, {
      message: "User with this email does not exist",
    });
  }

  if (user.is_verified) {
    throw createHttpError(400, {
      message: "Email is already verified",
    });
  }

  const existing = await EmailVerificationModal.findOne({
    user_id: user._id,
  });

  const now = new Date();

  if (existing) {
    const diff =
      now.getTime() - new Date(existing.otp_last_request_time).getTime();

    if (diff < 60 * 1000) {
      throw createHttpError(429, {
        message: "Please wait before requesting another OTP",
      });
    }

    const windowDiff =
      now.getTime() - new Date(existing.otp_last_request_time).getTime();

    if (windowDiff < 60 * 60 * 1000) {
      if (existing.otp_request_count >= 5) {
        throw createHttpError(429, {
          message: "Too many OTP requests. Try again later.",
        });
      }

      existing.otp_request_count += 1;
    } else {
      existing.otp_request_count = 1;
    }

    await EmailVerificationModal.deleteOne({ _id: existing._id });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const otp_hash = encryptpassword(otp);

  const verification_token = crypto.randomBytes(32).toString("hex");

  await EmailVerificationModal.create({
    user_id: user._id,
    verification_token,
    otp_hash,
    attempts: 0,
    is_verified: false,
    otp_request_count: existing ? existing.otp_request_count : 1,
    otp_last_request_time: now,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
  });

  if (process.env.IS_LOCAL === "true") {
    console.log("🔐 OTP (DEV ONLY):", otp);
  } else {
    await emailService.sendVerificationEmail({
      email,
      otp,
    });
  }

  return {
    verification_token,
  };
};

export const changePasswordService = async ({
  reset_token,
  new_password,
}: {
  reset_token: string;
  new_password: string;
}) => {
  const session = await PasswordResetModel.findOne({ reset_token }).lean();

  if (!session) {
    throw createHttpError(404, {
      message: "Invalid or expired password reset session",
    });
  }

  const invalidateSession = async () => {
    await PasswordResetModel.deleteOne({ _id: session._id });
  };

  if (session.expires_at < new Date()) {
    await invalidateSession();
    throw createHttpError(410, {
      message: "Session has expired, please start again",
    });
  }

  if (!session.is_verified) {
    await invalidateSession();
    throw createHttpError(400, {
      message: "OTP verification required",
    });
  }

  const user = await UserModel.findById(session.user_id);

  if (!user) {
    await invalidateSession();
    throw createHttpError(404, {
      message: "User not found",
    });
  }

  user.password = encryptpassword(new_password);
  await user.save();

  await invalidateSession();
  return;
};

const updateUserService = async (userId: string, data: any) => {
  await UserModel.findByIdAndUpdate(userId, {
    $set: data,
  });
};

const googleAuthSetPassword = async ({
  token,
  password,
  id,
}: {
  token: string;
  password: string;
  id: string;
}) => {
  const info = await verifyGoogleToken(token);
  if (!info) {
    throw createHttpError(400, { message: "Invalid accessToken" });
  }
  const { email, name } = info;

  const user = await UserModel.findOne({
    email: email,
    _id: id,
  });

  if (!user) {
    throw createHttpError(400, {
      message: "User with this email does not exist",
    });
  }
  const encryptedPassword = encryptpassword(password);
  user.password = encryptedPassword;
  user.is_verified = true;
  await user.save();

  const accessToken = createToken(user._id.toString());

  return { accessToken };
};

export const userService = {
  createUser,
  loginUser,
  googleauth,
  getUsers,
  getMyProfile,
  getUserById,
  getChatsService,
  sendOtpService,
  verifyOtpService,
  changePasswordService,
  verifyEmailOtpService,
  sendEmailVerificationOtpService,
  updateUserService,
  googleAuthSetPassword,
};
