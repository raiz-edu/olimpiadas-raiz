import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

function getRouteAccess(pathname: string) {
  const isAuthPage = pathname.startsWith("/login");
  const isAlunoArea = pathname.startsWith("/aluno/");
  const isStaffCallback = pathname.startsWith("/auth/callback");
  const isAcceptInvite = pathname.startsWith("/aceitar-convite");
  const isGoogleOAuth = pathname.startsWith("/api/auth/google");
  // Login Google em popup (plataforma embutida no Painel Pedagógico):
  // handoff da sessão do aluno — não há sessão Supabase nesse fluxo.
  const isPopupAuth =
    pathname.startsWith("/auth/popup-callback") || pathname.startsWith("/api/auth/popup-session");
  // Apresentação "A Trilha Olímpica" — página editorial pública, também
  // renderizada dentro do login.
  const isApresentacao = pathname.startsWith("/apresentacao");

  return {
    isPublicPath:
      pathname === "/" ||
      isAuthPage ||
      isAlunoArea ||
      isStaffCallback ||
      isAcceptInvite ||
      isGoogleOAuth ||
      isPopupAuth ||
      isApresentacao,
  };
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isPublicPath } = getRouteAccess(pathname);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath) return NextResponse.next({ request });

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
