import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Aluno } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALUNO_SESSION_COOKIE, verifyStudentCookie } from "./student-cookie";
import { destinoPortal } from "./portal-profile";

export type StudentSession = {
  aluno: Aluno;
  marcaSlug: string | null;
} | null;

/**
 * Recupera a sessão do aluno a partir do cookie próprio aluno_session.
 * Completamente independente do Supabase Auth — não é afetado pelo logout do admin.
 */
export async function getStudentSession(options?: {
  permitirCadastroIncompleto?: boolean;
  popup?: boolean;
}): Promise<StudentSession> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ALUNO_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const alunoId = verifyStudentCookie(raw);
  if (!alunoId) return null;

  const admin = createAdminClient();

  const { data: aluno } = await admin
    .from("aluno")
    .select("*")
    .eq("id", alunoId)
    .eq("ativo", true)
    .single();

  if (!aluno) return null;

  if (!options?.permitirCadastroIncompleto) {
    const destino = destinoPortal(aluno, options?.popup);
    if (destino !== "/aluno/dashboard" && destino !== "/auth/popup-callback") redirect(destino);
  }

  // Busca o slug da marca via adminClient
  let marcaSlug: string | null = null;
  if (aluno.turma_id) {
    const { data: turmaRow } = await admin
      .from("turma")
      .select("unidade:unidade_id(marca:marca_id(slug))")
      .eq("id", aluno.turma_id)
      .single();

    if (turmaRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unidade = (turmaRow as any).unidade;
      const marcaObj = Array.isArray(unidade) ? unidade[0]?.marca : unidade?.marca;
      marcaSlug = (Array.isArray(marcaObj) ? marcaObj[0]?.slug : marcaObj?.slug) ?? null;
    }
  } else if (aluno.marca_id) {
    // Aluno auto-provisionado via SSO (sem turma ainda) — busca marca diretamente
    const { data: marca } = await admin
      .from("marca")
      .select("slug")
      .eq("id", aluno.marca_id)
      .single();
    marcaSlug = marca?.slug ?? null;
  }

  return { aluno, marcaSlug };
}
