import resend from "../config/resend";
import { changePasswordProps } from "../types/email.types";

const sender = "Atlas Messenger <noreply@atlasmessanger.top>";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );

const createOtpEmail = ({
  title,
  preheader,
  message,
  otp,
}: {
  title: string;
  preheader: string;
  message: string;
  otp: string;
}) => {
  const safeOtp = escapeHtml(otp);

  return {
    text: `${title}\n\n${message}\n\nYour verification code: ${otp}\n\nThis code expires in 5 minutes. If you didn't request this, you can safely ignore this email.\n\nAtlas Messenger`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f5f9;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:0 0 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" width="42" height="42" style="width:42px;height:42px;border-radius:12px;background-color:#4f46e5;color:#ffffff;font-size:20px;font-weight:700;">A</td>
                    <td style="padding-left:12px;color:#172033;font-size:19px;font-weight:700;letter-spacing:-0.3px;">Atlas Messenger</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 32px;background-color:#ffffff;border:1px solid #e6e9f0;border-radius:16px;">
                <p style="margin:0 0 10px;color:#4f46e5;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${preheader}</p>
                <h1 style="margin:0 0 14px;color:#172033;font-size:26px;line-height:1.3;letter-spacing:-0.5px;">${title}</h1>
                <p style="margin:0;color:#586174;font-size:15px;line-height:1.7;">${message}</p>
                <p style="margin:28px 0 10px;color:#586174;font-size:13px;font-weight:600;">Your verification code</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:14px 22px;background-color:#f4f4ff;border:1px solid #e3e1ff;border-radius:10px;color:#3730a3;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:30px;font-weight:700;letter-spacing:8px;">${safeOtp}</td>
                  </tr>
                </table>
                <p style="margin:12px 0 0;color:#727b8d;font-size:13px;line-height:1.6;">For your security, this code expires in <strong style="color:#454d5d;">5 minutes</strong>.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td style="padding-top:20px;border-top:1px solid #edf0f5;color:#727b8d;font-size:13px;line-height:1.7;">If you didn't request this, you can safely ignore this email. Never share this code with anyone.</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 12px 0;color:#929aaa;font-size:12px;line-height:1.6;">This is an automated message from Atlas Messenger.<br>Please don't reply to this email.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
};

const changePasswordEmail = async ({ email, otp }: changePasswordProps) => {
  try {
    const content = createOtpEmail({
      title: "Reset your password",
      preheader: "Password reset",
      message:
        "Use the verification code below to reset your Atlas Messenger password.",
      otp,
    });

    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Reset your Atlas Messenger password",
      ...content,
    });

    if (response.error) {
      console.error(
        `[EmailService] Failed to send password reset email to ${email}:`,
        response.error,
      );
      throw new Error(
        `Failed to send password reset email: ${response.error.message || JSON.stringify(response.error)}`,
      );
    }

    return response;
  } catch (error) {
    console.error(
      `[EmailService] Error in changePasswordEmail for ${email}:`,
      error,
    );
    throw error;
  }
};

const sendVerificationEmail = async ({ email, otp }: changePasswordProps) => {
  try {
    const content = createOtpEmail({
      title: "Verify your email address",
      preheader: "Email verification",
      message:
        "Welcome to Atlas Messenger. Enter this code to verify your email address and finish setting up your account.",
      otp,
    });

    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Verify your Atlas Messenger email",
      ...content,
    });

    if (response.error) {
      console.error(
        `[EmailService] Failed to send verification email to ${email}:`,
        response.error,
      );
      throw new Error(
        `Failed to send verification email: ${response.error.message || JSON.stringify(response.error)}`,
      );
    }

    return response;
  } catch (error) {
    console.error(
      `[EmailService] Error in sendVerificationEmail for ${email}:`,
      error,
    );
    throw error;
  }
};

const sendSupportEmail = async ({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const recipient =
    process.env.SUPPORT_EMAIL || "daskhmahajan0110@gmail.com";
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  try {
    const response = await resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `[Support Query] ${subject} - from ${name}`,
      text: `Support Issue Reported\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n--\nAtlas Messenger Support Bot`,
      html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>New Support Query</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <h2 style="margin:0 0 16px;color:#0f172a;border-bottom:2px solid #3b82f6;padding-bottom:12px;">New User Support Query / Bug Report</h2>
      <p style="margin:8px 0;font-size:15px;"><strong>From:</strong> ${safeName} (&lt;${safeEmail}&gt;)</p>
      <p style="margin:8px 0;font-size:15px;"><strong>Subject:</strong> ${safeSubject}</p>
      <p style="margin:8px 0;font-size:15px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Message Content:</h3>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${safeMessage}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">You can reply directly to this email to contact the user at ${safeEmail}.</p>
    </div>
  </body>
</html>`,
    });

    if (response.error) {
      console.error(
        `[EmailService] Failed to send support email to ${recipient}:`,
        response.error,
      );
    }

    return response;
  } catch (error) {
    console.error(`[EmailService] Error in sendSupportEmail:`, error);
  }
};

export const emailService = {
  changePasswordEmail,
  sendVerificationEmail,
  sendSupportEmail,
};
