import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAllowedStaffEmail,
  isAllowedStudentEmail,
  podeEntrarNoPortalStaff,
} from "@/lib/auth/domains";
import { resolverPrimeiroAcesso, marcarConviteAceito } from "@/lib/auth/primeiro-acesso";
import {
  STAFF_SESSION_COOKIE,
  signCognitoSession,
  staffCookieOptions,
} from "@/lib/auth/cognito-session";
import {
  ALUNO_PENDING_COOKIE,
  ALUNO_SESSION_COOKIE,
  cookiePendingOpts,
  cookieSessionOpts,
  signStudentCookie,
} from "@/lib/auth/student-cookie";

type TokenResponse = { id_token: string; access_token: string; expires_in: number };

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("_cognito_state")?.value;
  cookieStore.delete("_cognito_state");
  if (!code || !state || state !== savedState)
    return NextResponse.redirect(`${origin}/login?erro=oauth`);
  const mode = state.split(":")[1] ?? "aluno";
  const popup = state.split(":")[2] === "popup";

  const clientId = process.env.COGNITO_CLIENT_ID!;
  const redirectUri = `${origin}/api/auth/cognito/callback`;
  const basic = Buffer.from(`${clientId}:${process.env.COGNITO_CLIENT_SECRET!}`).toString("base64");
  const tokenResponse = await fetch(`${process.env.COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return NextResponse.redirect(`${origin}/login?erro=oauth`);
  const tokens = (await tokenResponse.json()) as TokenResponse;

  const region = "sa-east-1";
  const poolId = process.env.COGNITO_USER_POOL_ID!;
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  let identity;
  try {
    identity = (await jwtVerify(tokens.id_token, jwks, { issuer, audience: clientId })).payload;
  } catch {
    return NextResponse.redirect(`${origin}/login?erro=oauth`);
  }
  const sub = String(identity.sub ?? "");
  const email = String(identity.email ?? "").toLowerCase();
  const name = String(identity.name ?? email);
  if (!sub || identity.email_verified !== true) {
    return NextResponse.redirect(`${origin}/login?erro=dominio`);
  }
  const admin = createAdminClient();
  if (mode !== "staff") {
    if (!isAllowedStudentEmail(email)) {
      return NextResponse.redirect(`${origin}/aluno/login?erro=dominio`);
    }
    const { data: aluno } = await admin
      .from("aluno")
      .select("id, consentimento_responsavel")
      .eq("email", email)
      .eq("ativo", true)
      .maybeSingle();
    if (!aluno) return NextResponse.redirect(`${origin}/aluno/login?erro=acesso`);
    const response = NextResponse.redirect(
      `${origin}${popup ? "/auth/popup-callback" : "/aluno/dashboard"}`,
    );
    if (aluno.consentimento_responsavel) {
      response.cookies.set(ALUNO_SESSION_COOKIE, signStudentCookie(aluno.id), cookieSessionOpts());
      await admin.rpc("registrar_login_aluno", { p_aluno_id: aluno.id });
    } else {
      response.cookies.set(ALUNO_PENDING_COOKIE, signStudentCookie(aluno.id), cookiePendingOpts());
    }
    return response;
  }
  if (!isAllowedStaffEmail(email)) return NextResponse.redirect(`${origin}/login?erro=dominio`);
  if (!podeEntrarNoPortalStaff(email)) return NextResponse.redirect(`${origin}/login?erro=portal`);

  let { data: usuario } = await admin.from("usuario").select("*").eq("email", email).maybeSingle();
  if (!usuario) {
    const { role, marcaId, conviteId } = await resolverPrimeiroAcesso(email);
    const created = await admin
      .from("usuario")
      .insert({ id: sub, email, nome: name, role, ativo: true, marca_ativa_id: marcaId })
      .select("*")
      .single();
    usuario = created.data;
    if (usuario && marcaId)
      await admin.from("usuario_marca").insert({ usuario_id: usuario.id, marca_id: marcaId });
    await marcarConviteAceito(conviteId);
  }
  if (!usuario?.ativo) return NextResponse.redirect(`${origin}/login?erro=inativo`);

  const session = signCognitoSession({
    sub,
    email,
    name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.cookies.set(STAFF_SESSION_COOKIE, session, staffCookieOptions);
  return response;
}
