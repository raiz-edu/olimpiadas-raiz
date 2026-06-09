import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleUsuario } from "@/lib/types/database";
import { isAllowedDomain, getEmailDomain, DOMAIN_TO_ROLE } from "@/lib/auth/domains";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=oauth`);
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
    return NextResponse.redirect(`${origin}/login?erro=oauth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?erro=oauth`);
  }

  if (!isAllowedDomain(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=dominio`);
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from("usuario")
    .select("id, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario) {
    const domain = getEmailDomain(user.email);
    const role = (DOMAIN_TO_ROLE[domain] ?? "professor") as RoleUsuario;
    const nome: string =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0] ??
      user.email;

    await admin
      .from("usuario")
      .insert({ id: user.id, email: user.email as string, nome, role, ativo: true });
  } else if (!usuario.ativo) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=inativo`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
