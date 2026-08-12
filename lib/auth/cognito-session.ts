import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STAFF_SESSION_COOKIE = "olymp_staff_session";

export type CognitoSession = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signature(payload: string) {
  return createHmac("sha256", process.env.SESSION_SIGNING_SECRET!)
    .update(payload)
    .digest("base64url");
}

export function signCognitoSession(session: CognitoSession) {
  const payload = encode(JSON.stringify(session));
  return `${payload}.${signature(payload)}`;
}

export function verifyCognitoSession(value?: string): CognitoSession | null {
  if (!value) return null;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied) return null;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CognitoSession;
    return session.exp > Math.floor(Date.now() / 1000) ? session : null;
  } catch {
    return null;
  }
}

export async function readCognitoSession() {
  return verifyCognitoSession((await cookies()).get(STAFF_SESSION_COOKIE)?.value);
}

export const staffCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60,
};
