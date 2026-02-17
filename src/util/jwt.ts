import jwt from "jsonwebtoken";
export function createToken(userId: string) {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET!, {
    expiresIn: "365d",
  });
  return token;
}
