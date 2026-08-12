import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") ?? "aluno";
  const isPopup = request.nextUrl.searchParams.get("popup") === "1";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  const nonce = randomBytes(24).toString("base64url");
  const state = `${nonce}:${mode}${isPopup ? ":popup" : ""}`;

  const cookieStore = await cookies();
  cookieStore.set("_cognito_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${origin}/api/auth/cognito/callback`;
  const params = new URLSearchParams({
    client_id: process.env.COGNITO_CLIENT_ID!,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state,
    identity_provider: "Google",
  });
  return NextResponse.redirect(`${process.env.COGNITO_DOMAIN}/oauth2/authorize?${params}`);
}
