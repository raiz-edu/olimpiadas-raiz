import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleUsuario } from "@/lib/types/database";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  isAllowedStaffEmail,
  isAllowedStudentEmail,
  getRoleForEmail,
  getMarcaSlugForEmail,
  ADMIN_EMAILS,
} from "@/lib/auth/domains";
import {
  ALUNO_SESSION_COOKIE,
  ALUNO_PENDING_COOKIE,
  signStudentCookie,
  cookieSessionOpts,
  cookiePendingOpts,
} from "@/lib/auth/student-cookie";

interface GoogleTokens {
  access_token: string;
  id_token: string;
}

interface GooglePayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

// JWKS do Google — criado uma vez no nível do módulo para aproveitar o cache interno do jose
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

async function verifyIdToken(token: string): Promise<GooglePayload> {
  const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
    issuer: "https://accounts.google.com",
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  return payload as unknown as GooglePayload;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("_goauth_state")?.value;
  cookieStore.set("_goauth_state", "", { maxAge: 0, path: "/" });

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const mode = state.split(":")[1] ?? "aluno";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const tokens = (await tokenRes.json()) as GoogleTokens;

  let payload: GooglePayload;
  try {
    payload = await verifyIdToken(tokens.id_token);
  } catch {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const email = payload.email?.toLowerCase();

  if (!email || !payload.email_verified) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const admin = createAdminClient();

  // ── Portal staff (apenas admins designados) ─────────────────────────────
  if (mode === "staff") {
    if (!isAllowedStaffEmail(email)) {
      return NextResponse.redirect(`${origin}/login?erro=dominio`);
    }

    if (!ADMIN_EMAILS.has(email)) {
      return NextResponse.redirect(`${origin}/aluno/login?erro=portal`);
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) =>
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    );

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: tokens.id_token,
      access_token: tokens.access_token,
    });

    if (error) return NextResponse.redirect(`${origin}/login?erro=oauth`);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/login?erro=oauth`);

    const { data: usuario } = await admin
      .from("usuario")
      .select("id, ativo")
      .eq("id", user.id)
      .maybeSingle();

    if (!usuario) {
      await admin.from("usuario").insert({
        id: user.id,
        email,
        nome: payload.name,
        role: getRoleForEmail(email) as RoleUsuario,
        ativo: true,
      });

      const marcaSlug = getMarcaSlugForEmail(email);
      if (marcaSlug) {
        const { data: marca } = await admin
          .from("marca")
          .select("id")
          .eq("slug", marcaSlug)
          .maybeSingle();
        if (marca) {
          await admin.from("usuario_marca").insert({ usuario_id: user.id, marca_id: marca.id });
        }
      }
    } else if (!usuario.ativo) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?erro=inativo`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // ── Portal aluno (default) ───────────────────────────────────────────────
  if (!isAllowedStudentEmail(email)) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=dominio`);
  }

  let { data: aluno } = await admin
    .from("aluno")
    .select("id, consentimento_responsavel")
    .eq("email", email)
    .eq("ativo", true)
    .maybeSingle();

  if (!aluno) {
    const marcaSlug = getMarcaSlugForEmail(email);
    let marcaId: string | null = null;
    if (marcaSlug) {
      const { data: marca } = await admin
        .from("marca")
        .select("id")
        .eq("slug", marcaSlug)
        .maybeSingle();
      marcaId = marca?.id ?? null;
    }

    const { data: novoAluno } = await admin
      .from("aluno")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ email, nome: payload.name, ativo: true, marca_id: marcaId } as any)
      .select("id, consentimento_responsavel")
      .single();

    aluno = novoAluno;
  }

  if (!aluno) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const marcaSlugHint = getMarcaSlugForEmail(email);
  const marcaHintOpts = {
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
  };

  if (!aluno.consentimento_responsavel) {
    if (marcaSlugHint) cookieStore.set("marca_hint", marcaSlugHint, marcaHintOpts);
    cookieStore.set(ALUNO_PENDING_COOKIE, signStudentCookie(aluno.id), cookiePendingOpts());
    return NextResponse.redirect(`${origin}/aluno/login`);
  }

  if (marcaSlugHint) cookieStore.set("marca_hint", marcaSlugHint, marcaHintOpts);
  cookieStore.set(ALUNO_SESSION_COOKIE, signStudentCookie(aluno.id), cookieSessionOpts());
  return NextResponse.redirect(`${origin}/aluno/dashboard`);
}
