import { MediaModel } from "../models/media_modal";

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface loginUserDto {
  email: string;
  password: string;
}

export interface searchUser {
  page?: string;
  search?: string;
  limit?: string;
}

export interface updateProfile {
  bio?: string;
  profile_picture?: string;
  media?: MediaModel;
}
