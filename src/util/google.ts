import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
const client = new OAuth2Client(clientId);

export async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();

  return payload;
}
