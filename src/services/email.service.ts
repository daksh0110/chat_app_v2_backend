import resend from "../config/resend";
import { changePasswordProps } from "../types/email.types";

const changePasswordEmail = async ({ email, otp }: changePasswordProps) => {
  const info = resend.emails.send({
    from: "Atlas Messenger <noreply@atlasmessanger.top>",
    to: email,
    subject: "Change Password",
    text: `Your verification code is ${otp}`,
    html: `<b>Your verification code is ${otp}</b>`,
  });

  return info;
};

const sendVerificationEmail = async ({ email, otp }: changePasswordProps) => {
  const info = resend.emails.send({
    from: "Atlas Messenger <noreply@atlasmessanger.top>",
    to: email,
    subject: "Email Verification",
    text: `Your verification code is ${otp}`,
    html: `<b>Your verification code is ${otp}</b>`,
  });

  return info;
};

export const emailService = {
  changePasswordEmail,
  sendVerificationEmail,
};
