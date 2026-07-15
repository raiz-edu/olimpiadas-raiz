import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALUNO_SESSION_COOKIE,
  signStudentCookie,
  verifyPopupHandoff,
  cookieSessionEmbedOpts,
} from "@/lib/auth/student-cookie";

/**
 * Troca o token de handoff (recebido pelo iframe via postMessage do popup de
 * login) pela sessão do aluno. Chamado de dentro do iframe: o Set-Cookie usa
 * SameSite=None + Partitioned para que a sessão funcione no contexto embutido
 * (Painel Pedagógico), onde cookies Lax não são enviados.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { handoff?: string } | null;
  const handoff = typeof body?.handoff === "string" ? body.handoff : null;

  const alunoId = handoff ? verifyPopupHandoff(handoff) : null;
  if (!alunoId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: aluno } = await admin
    .from("aluno")
    .select("id")
    .eq("id", alunoId)
    .eq("ativo", true)
    .maybeSingle();

  if (!aluno) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ALUNO_SESSION_COOKIE, signStudentCookie(alunoId), cookieSessionEmbedOpts());
  return res;
}
