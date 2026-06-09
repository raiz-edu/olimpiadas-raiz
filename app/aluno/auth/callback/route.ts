import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALUNO_SESSION_COOKIE,
  ALUNO_PENDING_COOKIE,
  signStudentCookie,
  cookieSessionOpts,
  cookiePendingOpts,
} from "@/lib/auth/student-cookie";
import { isAllowedDomain, getEmailDomain, DOMAIN_TO_MARCA_SLUG } from "@/lib/auth/domains";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  if (!isAllowedDomain(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/aluno/login?erro=dominio`);
  }

  const admin = createAdminClient();

  let { data: aluno } = await admin
    .from("aluno")
    .select("id, consentimento_responsavel, supabase_auth_id")
    .eq("email", user.email)
    .eq("ativo", true)
    .maybeSingle();

  // Auto-provisionamento: cria o registro na primeira vez
  if (!aluno) {
    const domain = getEmailDomain(user.email);
    const marcaSlug = DOMAIN_TO_MARCA_SLUG[domain];

    let marcaId: string | null = null;
    if (marcaSlug) {
      const { data: marca } = await admin
        .from("marca")
        .select("id")
        .eq("slug", marcaSlug)
        .maybeSingle();
      marcaId = marca?.id ?? null;
    }

    const nome: string =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0] ??
      user.email;

    const { data: novoAluno } = await admin
      .from("aluno")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        email: user.email as string,
        nome,
        supabase_auth_id: user.id,
        marca_id: marcaId,
        ativo: true,
      } as any)
      .select("id, consentimento_responsavel, supabase_auth_id")
      .single();

    aluno = novoAluno;
  }

  if (!aluno) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/aluno/login?erro=oauth`);
  }

  if (!aluno.supabase_auth_id) {
    await admin.from("aluno").update({ supabase_auth_id: user.id }).eq("id", aluno.id);
  }

  if (!aluno.consentimento_responsavel) {
    cookieStore.set(ALUNO_PENDING_COOKIE, signStudentCookie(aluno.id), cookiePendingOpts());
    return NextResponse.redirect(`${origin}/aluno/login`);
  }

  cookieStore.set(ALUNO_SESSION_COOKIE, signStudentCookie(aluno.id), cookieSessionOpts());
  return NextResponse.redirect(`${origin}/aluno/dashboard`);
}
