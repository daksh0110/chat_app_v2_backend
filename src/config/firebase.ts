import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not defined");
}

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID is not defined");
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error("FIREBASE_CLIENT_EMAIL is not defined");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export default admin;
