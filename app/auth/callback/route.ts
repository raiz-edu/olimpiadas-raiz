import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleUsuario } from "@/lib/types/database";
import {
  isAllowedStaffEmail,
  getRoleForEmail,
  getMarcaSlugForEmail,
  ADMIN_EMAILS,
} from "@/lib/auth/domains";

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

  if (!isAllowedStaffEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=dominio`);
  }

  // Área administrativa restrita: apenas os 2 admins designados
  if (!ADMIN_EMAILS.has(user.email.toLowerCase())) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/aluno/login?erro=portal`);
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from("usuario")
    .select("id, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario) {
    const role = getRoleForEmail(user.email) as RoleUsuario;
    const nome: string =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0] ??
      user.email;

    await admin
      .from("usuario")
      .insert({ id: user.id, email: user.email as string, nome, role, ativo: true });

    // Vincula a marca automaticamente pelo domínio do email (resolve subdomínios)
    const marcaSlug = getMarcaSlugForEmail(user.email);
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
