import createHttpError from "http-errors";
import { IUser, UserModel } from "../models/user.model";
import { CreateUserDto, loginUserDto, searchUser } from "../types/user.types";
import { comparePassword, encryptpassword } from "../util/bcrypt";
import { createToken, verifyToken } from "../util/jwt";
import { verifyGoogleToken } from "../util/google";
import mongoose, { QueryFilter } from "mongoose";

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
    .select("name email")
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
export const userService = {
  createUser,
  loginUser,
  googleauth,
  getUsers,
  getMyProfile,
  getUserById,
};
