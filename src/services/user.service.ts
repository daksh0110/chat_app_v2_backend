import createHttpError from "http-errors";
import { IUser, UserModel } from "../models/user.model";
import { CreateUserDto, loginUserDto, searchUser } from "../types/user.types";
import { comparePassword, encryptpassword } from "../util/bcrypt";
import { createToken, verifyToken } from "../util/jwt";
import { verifyGoogleToken } from "../util/google";
import mongoose, { PipelineStage, QueryFilter, Types } from "mongoose";
import { ChatMemberModel } from "../models/chat_group_member.modal";
import { MessageStatus } from "../models/message.modal";

const createUser = async (data: CreateUserDto) => {
  try {
    const encryptedPassword = encryptpassword(data.password);

    const user = await UserModel.create({
      email: data.email,
      name: data.name,
      password: encryptedPassword,
    });

    return { accessToken: createToken(user._id.toString()) };
  } catch (error: any) {
    if (error.code === 11000) {
      throw createHttpError(400, "User with this email already exists");
    }
    throw error;
  }
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

  const accessToken = createToken(user._id.toString());

  return {
    accessToken,
  };
};

const googleauth = async (data: { token: string }) => {
  const info = await verifyGoogleToken(data.token);
  if (!info) {
    throw createHttpError(400, { message: "Invalid accessToken" });
  }
  const { email, name } = info;

  const user = await UserModel.findOne({
    email: email,
  });
  if (user) {
    const accessToken = createToken(user._id.toString());
    return { accessToken };
  }

  return { name, email, newUser: true, accessToken: null };
};

const getUsers = async (data: searchUser) => {
  const page = parseInt(data.page || "1");
  const search = data.search || "";

  const limit = 10;
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IUser> = {};

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
    .select("name email")
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
    .select("name email _id")
    .lean();

  return user;
};

const getUserById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, { message: "Invalid user id" });
  }

  const user = await UserModel.findById(id).select("name email").lean();

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
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 1,
              chat_id: 1,
              message: 1,
              sender_id: 1,
              status: 1,
              createdAt: 1,
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
        last_message_time: { $arrayElemAt: ["$messages.createdAt", 0] },
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

  // Flatten messages for Drift sync
  const messages: any[] = [];

  chats.forEach((chat) => {
    chat.messages.forEach((msg: any) => {
      messages.push({
        ...msg,
        chat_id: chat.chat_id,
      });
    });
  });

  return {
    chats: chats.map((chat) => ({
      chat_id: chat.chat_id,
      user_id: chat.user_id,
      name: chat.name,
      last_message: chat.last_message,
      last_message_time: chat.last_message_time,
      un_read_count: chat.un_read_count,
    })),
    messages,
  };
};
export const userService = {
  createUser,
  loginUser,
  googleauth,
  getUsers,
  getMyProfile,
  getUserById,
  getChatsService,
};
