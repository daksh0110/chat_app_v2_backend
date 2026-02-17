import createHttpError from "http-errors";
import { UserModel } from "../models/user.model";
import { CreateUserDto, loginUserDto } from "../types/user.types";
import { comparePassword, encryptpassword } from "../util/bcrypt";
import { createToken } from "../util/jwt";

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
  console.log(user.password, password);
  if (!isMatch) {
    throw createHttpError(400, { message: "Invalid credentials" });
  }

  const accessToken = createToken(user._id.toString());

  return {
    accessToken,
  };
};

export const userService = {
  createUser,
  loginUser,
};
