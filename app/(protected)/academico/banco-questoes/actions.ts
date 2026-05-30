"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import type { OlimpiadaQuestao, TipoQuestao } from "@/lib/types/database";

export type QuestaoState = { error: string } | { ok: true; id?: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) {
    throw new Error("Não autorizado");
  }
  return session;
}

// ─── Listagem ────────────────────────────────────────────────────────────────

export async function getQuestoes(filtros?: {
  olimpiada?: string;
  fase?: number;
  ano?: number;
  assunto?: string;
  ativo?: boolean;
}) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  let query = supabase
    .from("questao")
    .select("id, olimpiada, nivel, fase, ano, numero, assunto, tipo, ativo, criado_em")
    .order("olimpiada")
    .order("fase")
    .order("ano")
    .order("numero");

  if (filtros?.olimpiada) query = query.eq("olimpiada", filtros.olimpiada);
  if (filtros?.fase) query = query.eq("fase", filtros.fase);
  if (filtros?.ano) query = query.eq("ano", filtros.ano);
  if (filtros?.assunto) query = query.ilike("assunto", `%${filtros.assunto}%`);
  if (filtros?.ativo !== undefined) query = query.eq("ativo", filtros.ativo);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getQuestaoDetalhe(id: string) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const [{ data: questao }, { data: alternativas }, { data: solucao }] = await Promise.all([
    supabase.from("questao").select("*").eq("id", id).single(),
    supabase.from("alternativa").select("*").eq("questao_id", id).order("letra"),
    supabase.from("solucao").select("*").eq("questao_id", id).maybeSingle(),
  ]);

  // Estatísticas de respostas
  const { data: stats } = await supabase
    .from("resposta_aluno")
    .select("correta, alternativa_id")
    .eq("questao_id", id);

  return { questao, alternativas: alternativas ?? [], solucao, stats: stats ?? [] };
}

// ─── Questão CRUD ────────────────────────────────────────────────────────────

export async function criarQuestao(_prev: QuestaoState, formData: FormData): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:create")) return { error: "Não autorizado" };

  const olimpiada = formData.get("olimpiada") as OlimpiadaQuestao;
  const nivel = (formData.get("nivel") as string) || null;
  const fase = Number(formData.get("fase"));
  const ano = Number(formData.get("ano"));
  const numero = Number(formData.get("numero"));
  const enunciado = ((formData.get("enunciado") as string) ?? "").trim();
  const assunto = ((formData.get("assunto") as string) ?? "").trim() || null;
  const tipo = (formData.get("tipo") as TipoQuestao) || "multipla_escolha";
  const video_url = ((formData.get("video_url") as string) ?? "").trim() || null;

  if (!olimpiada || !fase || !ano || !numero || !enunciado)
    return { error: "Preencha todos os campos obrigatórios." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("questao")
    .insert({ olimpiada, nivel, fase, ano, numero, enunciado, assunto, tipo, video_url })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/academico/banco-questoes");
  redirect(`/academico/banco-questoes/${data.id}`);
}

export async function atualizarQuestao(id: string, _prev: QuestaoState, formData: FormData): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("questao").update({
    olimpiada: formData.get("olimpiada"),
    nivel: (formData.get("nivel") as string) || null,
    fase: Number(formData.get("fase")),
    ano: Number(formData.get("ano")),
    numero: Number(formData.get("numero")),
    enunciado: formData.get("enunciado"),
    assunto: ((formData.get("assunto") as string) ?? "").trim() || null,
    tipo: formData.get("tipo"),
    video_url: ((formData.get("video_url") as string) ?? "").trim() || null,
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/academico/banco-questoes");
  revalidatePath(`/academico/banco-questoes/${id}`);
  return { ok: true };
}

export async function toggleAtivo(id: string, ativo: boolean) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("questao").update({ ativo }).eq("id", id);
  revalidatePath("/academico/banco-questoes");
}

// ─── Alternativas ────────────────────────────────────────────────────────────

export async function salvarAlternativa(_prev: QuestaoState, formData: FormData): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  const questao_id = formData.get("questao_id") as string;
  const letra = formData.get("letra") as string;
  const texto = ((formData.get("texto") as string) ?? "").trim() || null;
  const correta = formData.get("correta") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Se correta, remove flag das outras
  if (correta) {
    await supabase.from("alternativa").update({ correta: false }).eq("questao_id", questao_id);
  }

  const { error } = await supabase.from("alternativa").upsert(
    { questao_id, letra, texto, correta },
    { onConflict: "questao_id,letra" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
  return { ok: true };
}

export async function excluirAlternativa(id: string, questao_id: string) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("alternativa").delete().eq("id", id);
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
}

// ─── Solução ─────────────────────────────────────────────────────────────────

export async function salvarSolucao(_prev: QuestaoState, formData: FormData): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  const questao_id = formData.get("questao_id") as string;
  const texto = ((formData.get("texto") as string) ?? "").trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("solucao").upsert(
    { questao_id, texto },
    { onConflict: "questao_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
  return { ok: true };
}
