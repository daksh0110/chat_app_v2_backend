import admin from "../config/firebase";

export const sendNotification = async ({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
    });

    return response;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
};
