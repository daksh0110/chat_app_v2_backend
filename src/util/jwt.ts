import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/jwt.types";
export function createToken(userId: string) {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET!, {
    expiresIn: "365d",
  });
  return token;
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
