import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // Refresh session sem getUser para não expor token no server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isAlunoAuth = pathname.startsWith("/aluno/login");
  const isAlunoCallback = pathname.startsWith("/aluno/auth/callback");
  const isStaffCallback = pathname.startsWith("/auth/callback");
  const isAcceptInvite = pathname.startsWith("/aceitar-convite");
  const isGoogleOAuth = pathname.startsWith("/api/auth/google");
  const isPublicPath =
    pathname === "/" ||
    isAuthPage ||
    isAlunoAuth ||
    isAlunoCallback ||
    isStaffCallback ||
    isAcceptInvite ||
    isGoogleOAuth;

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    // Rotas do aluno redirecionam para o login do aluno, não o login do staff
    url.pathname = pathname.startsWith("/aluno/") ? "/aluno/login" : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
