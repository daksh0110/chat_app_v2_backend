import admin from "../config/firebase";

export const sendNotification = async ({
  token,
  title,
  body,
  image,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  image?: string;
  data?: Record<string, string>;
}) => {
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title,
        body,
        ...(image ? { image } : {}),
      },
      data,
    });

    return response;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
};
