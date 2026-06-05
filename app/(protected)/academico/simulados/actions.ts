/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";

const PATH = "/academico/simulados";

export type SimuladoAdminState = { error: string } | { ok: true } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDuracao(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(":").map(Number);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return null;
}

function withBRT(dt: string | null): string | null {
  if (!dt) return null;
  return dt.includes("T") && !dt.includes("+") && !dt.endsWith("Z") ? dt + ":00-03:00" : dt;
}

async function requireSession() {
  const session = await getServerSession();
  if (!session) throw new Error("Não autorizado");
  return session;
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

export type SimuladoAdmin = {
  id: string;
  titulo: string;
  publicada: boolean;
  data_hora: string | null;
  duracao_minutos: number | null;
  descricao: string | null;
  projeto_id: string | null;
  projeto_ids: string[];
  series_elegiveis: string[];
  criado_em: string;
};

export async function getSimulados(): Promise<SimuladoAdmin[]> {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("preparacao_aula")
    .select(
      "id, titulo, publicada, data_hora, duracao_minutos, descricao, projeto_id, projeto_ids, series_elegiveis, criado_em",
    )
    .eq("tipo", "simulado")
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function getSimuladoDetalhe(id: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("preparacao_aula")
    .select(
      `id, titulo, publicada, data_hora, duracao_minutos, link_aula, polos, descricao,
       projeto_id, projeto_ids, series_elegiveis, criado_em,
       questoes:preparacao_aula_questao(
         id, ordem, questao_id, visivel_aluno, questao:questao_id(
           id, olimpiada, nivel, fase, ano, numero, enunciado, topico, subtopico
         )
       )`,
    )
    .eq("id", id)
    .eq("tipo", "simulado")
    .single();
  return data;
}

export async function getProjetos() {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("preparacao_projeto")
    .select("id, nome, olimpiada_sigla, ano_letivo")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function getTurmas() {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("turma")
    .select("id, nome, serie, ano_letivo, unidade:unidade_id(nome)")
    .eq("ativo", true)
    .order("nome");
  return (data ?? []).map((t: any) => ({
    ...t,
    unidade_nome: Array.isArray(t.unidade) ? t.unidade[0]?.nome : (t.unidade?.nome ?? ""),
  }));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function criarSimulado(
  _prev: SimuladoAdminState,
  formData: FormData,
): Promise<SimuladoAdminState> {
  await requireSession();

  const titulo = (formData.get("titulo") as string)?.trim();
  if (!titulo) return { error: "Título é obrigatório" };

  const modalidade = formData.get("modalidade") as string;
  const data_hora = withBRT((formData.get("data_hora") as string) || null);
  const duracao = parseDuracao(formData.get("duracao") as string);
  const link = (formData.get("link") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const publicada = formData.get("publicada") === "true";
  const projetoIds = formData.getAll("projeto_ids[]") as string[];
  const seriesElegiveis = formData.getAll("series_elegiveis[]") as string[];

  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("preparacao_aula")
    .insert({
      titulo,
      tipo: "simulado",
      modalidade_online: modalidade === "online" ? "ao_vivo" : null,
      data_hora,
      duracao_minutos: duracao,
      link_aula: link,
      polos,
      descricao,
      publicada,
      projeto_ids: projetoIds,
      series_elegiveis: seriesElegiveis,
      ordem: 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  redirect(`${PATH}/${data.id}`);
}

export async function atualizarSimulado(
  id: string,
  _prev: SimuladoAdminState,
  formData: FormData,
): Promise<SimuladoAdminState> {
  await requireSession();

  const titulo = (formData.get("titulo") as string)?.trim();
  if (!titulo) return { error: "Título é obrigatório" };

  const modalidade = formData.get("modalidade") as string;
  const data_hora = withBRT((formData.get("data_hora") as string) || null);
  const duracao = parseDuracao(formData.get("duracao") as string);
  const link = (formData.get("link") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const publicada = formData.get("publicada") === "true";
  const projetoIds = formData.getAll("projeto_ids[]") as string[];
  const seriesElegiveis = formData.getAll("series_elegiveis[]") as string[];

  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from("preparacao_aula")
    .update({
      titulo,
      modalidade_online: modalidade === "online" ? "ao_vivo" : null,
      data_hora,
      duracao_minutos: duracao,
      link_aula: link,
      polos,
      descricao,
      publicada,
      projeto_ids: projetoIds,
      series_elegiveis: seriesElegiveis,
    })
    .eq("id", id)
    .eq("tipo", "simulado");

  if (error) return { error: error.message };
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return { ok: true };
}

export async function excluirSimulado(id: string): Promise<void> {
  await requireSession();
  const supabase = createAdminClient() as any;
  await supabase.from("preparacao_aula").delete().eq("id", id).eq("tipo", "simulado");
  revalidatePath(PATH);
  redirect(PATH);
}

export async function publicarSimulado(id: string): Promise<void> {
  await requireSession();
  const supabase = createAdminClient() as any;
  await supabase.from("preparacao_aula").update({ publicada: true }).eq("id", id);
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
}

export async function despublicarSimulado(id: string): Promise<void> {
  await requireSession();
  const supabase = createAdminClient() as any;
  await supabase.from("preparacao_aula").update({ publicada: false }).eq("id", id);
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
}

// ─── Questões do simulado ─────────────────────────────────────────────────────

export async function vincularQuestao(
  simuladoId: string,
  questaoId: string,
): Promise<SimuladoAdminState> {
  await requireSession();
  const supabase = createAdminClient() as any;

  // Próxima ordem
  const { count } = await supabase
    .from("preparacao_aula_questao")
    .select("id", { count: "exact", head: true })
    .eq("aula_id", simuladoId);

  const { error } = await supabase
    .from("preparacao_aula_questao")
    .insert({ aula_id: simuladoId, questao_id: questaoId, ordem: (count ?? 0) + 1 });

  if (error) return { error: error.message };
  revalidatePath(`${PATH}/${simuladoId}`);
  return { ok: true };
}

export async function toggleVisivelAluno(
  simuladoId: string,
  aulaQuestaoId: string,
  visivel: boolean,
): Promise<void> {
  await requireSession();
  const supabase = createAdminClient() as any;
  await supabase
    .from("preparacao_aula_questao")
    .update({ visivel_aluno: visivel })
    .eq("id", aulaQuestaoId)
    .eq("aula_id", simuladoId);
  revalidatePath(`${PATH}/${simuladoId}`);
}

export async function desvincularQuestao(simuladoId: string, questaoId: string): Promise<void> {
  await requireSession();
  const supabase = createAdminClient() as any;
  await supabase
    .from("preparacao_aula_questao")
    .delete()
    .eq("aula_id", simuladoId)
    .eq("questao_id", questaoId);
  revalidatePath(`${PATH}/${simuladoId}`);
}

export async function criarQuestaoParaSimulado(
  simuladoId: string,
  _prev: SimuladoAdminState,
  formData: FormData,
): Promise<SimuladoAdminState> {
  await requireSession();

  const olimpiada = (formData.get("olimpiada") as string) ?? "";
  const nivel = (formData.get("nivel") as string) || null;
  const faseRaw = (formData.get("fase") as string)?.trim();
  const fase = faseRaw ? Number(faseRaw) : null;
  const ano = Number(formData.get("ano")) || new Date().getFullYear();
  const numeroRaw = (formData.get("numero") as string)?.trim();
  const numero = numeroRaw ? Number(numeroRaw) : null;
  const enunciado = ((formData.get("enunciado") as string) ?? "").trim();
  const topico = ((formData.get("topico") as string) ?? "").trim() || null;
  const subtopico = ((formData.get("subtopico") as string) ?? "").trim() || null;
  const tipo = (formData.get("tipo") as string) || "multipla_escolha";

  if (!enunciado) return { error: "Enunciado é obrigatório" };

  const supabase = createAdminClient() as any;

  const { data: questao, error: qErr } = await supabase
    .from("questao")
    .insert({
      olimpiada,
      nivel,
      fase,
      ano,
      numero,
      enunciado,
      topico,
      subtopico,
      tipo,
      ativo: true,
    })
    .select("id")
    .single();

  if (qErr) return { error: qErr.message };

  const { count } = await supabase
    .from("preparacao_aula_questao")
    .select("id", { count: "exact", head: true })
    .eq("aula_id", simuladoId);

  const { error: lErr } = await supabase
    .from("preparacao_aula_questao")
    .insert({ aula_id: simuladoId, questao_id: questao.id, ordem: (count ?? 0) + 1 });

  if (lErr) return { error: lErr.message };
  revalidatePath(`${PATH}/${simuladoId}`);
  return { ok: true };
}

export async function buscarQuestoes(busca: string, origem?: string) {
  const supabase = createAdminClient() as any;
  let query = supabase
    .from("questao")
    .select("id, olimpiada, nivel, fase, ano, numero, enunciado, topico, subtopico")
    .eq("ativo", true);

  if (origem) query = query.eq("olimpiada", origem);

  if (busca.trim()) {
    const n = Number(busca.trim());
    if (!isNaN(n) && n > 0) {
      query = query.eq("numero", n);
    } else {
      query = query.ilike("enunciado", `%${busca}%`);
    }
  }

  const { data } = await query.limit(20);
  return data ?? [];
}
