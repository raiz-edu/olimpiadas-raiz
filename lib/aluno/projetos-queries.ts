import type { createAdminClient } from "@/lib/supabase/admin";

/** Consultar somente no servidor, depois de validar a sessão própria do aluno. */
export async function getOlimpiadaIdsConfirmadas(
  db: ReturnType<typeof createAdminClient>,
  alunoId: string,
): Promise<Set<string>> {
  const { data, error } = await db
    .from("inscricao")
    .select("olimpiada_id")
    .eq("aluno_id", alunoId)
    .eq("status", "confirmada");

  if (error) {
    console.error("[projetos] Falha ao consultar inscrições:", error.message);
    throw new Error("Não foi possível carregar os projetos. Tente novamente.");
  }

  return new Set((data ?? []).map((inscricao) => inscricao.olimpiada_id));
}
