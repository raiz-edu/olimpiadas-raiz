import { NextResponse, type NextRequest } from "next/server";
import { STAFF_SESSION_COOKIE } from "@/lib/auth/cognito-session";

function getRouteAccess(pathname: string) {
  const isAuthPage = pathname.startsWith("/login");
  const isAlunoArea = pathname.startsWith("/aluno/");
  const isStaffCallback = pathname.startsWith("/auth/callback");
  const isAcceptInvite = pathname.startsWith("/aceitar-convite");
  const isGoogleOAuth = pathname.startsWith("/api/auth/google");
  const isHealthCheck = pathname === "/api/health";
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
      isHealthCheck ||
      isPopupAuth ||
      isApresentacao,
  };
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isPublicPath } = getRouteAccess(pathname);
  const hasStaffSession = Boolean(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  if (!hasStaffSession && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
