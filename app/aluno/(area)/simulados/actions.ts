/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/auth/student-session";
import { revalidatePath } from "next/cache";
import { sanitizeRespostasSimulado } from "@/lib/aluno/security";

const admin = () => createAdminClient() as any;

async function sanitizarRespostasDoSimulado(
  db: any,
  aulaId: string,
  respostas: RespostasSalvas,
): Promise<RespostasSalvas> {
  const { data: aulaQuestoes } = await db
    .from("preparacao_aula_questao")
    .select("questao_id, questao:questao_id(id, ativo, status_cadastro)")
    .eq("aula_id", aulaId)
    .eq("visivel_aluno", true);

  const questoesPermitidas = new Set<string>();
  for (const row of aulaQuestoes ?? []) {
    const questao = Array.isArray(row.questao) ? row.questao[0] : row.questao;
    if (questao?.ativo === true && questao?.status_cadastro === "publicado") {
      questoesPermitidas.add(row.questao_id);
    }
  }

  const alternativaIds = [
    ...new Set(
      Object.values(respostas)
        .map((r) => r?.alternativa_id)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    ),
  ];

  const alternativasPorId = new Map<string, { id: string; questao_id: string; correta: boolean }>();
  if (alternativaIds.length > 0) {
    const { data: alternativas } = await db
      .from("alternativa")
      .select("id, questao_id, correta")
      .in("id", alternativaIds);

    for (const alternativa of alternativas ?? []) {
      alternativasPorId.set(alternativa.id, alternativa);
    }
  }

  const questaoIds = [...questoesPermitidas];
  const alternativaCorretaPorQuestao = new Map<string, string>();
  if (questaoIds.length > 0) {
    const { data: corretas } = await db
      .from("alternativa")
      .select("id, questao_id")
      .in("questao_id", questaoIds)
      .eq("correta", true);

    for (const correta of corretas ?? []) {
      if (!alternativaCorretaPorQuestao.has(correta.questao_id)) {
        alternativaCorretaPorQuestao.set(correta.questao_id, correta.id);
      }
    }
  }

  return sanitizeRespostasSimulado(
    respostas,
    questoesPermitidas,
    alternativasPorId,
    alternativaCorretaPorQuestao,
  );
}

function normalizarInteiroNaoNegativo(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RespostasSalvas = Record<
  string,
  {
    correta: boolean;
    alternativa_id: string;
    alternativa_correta_id: string | null;
  }
>;

export type SimuladoSessao = {
  id: string;
  aluno_id: string;
  aula_id: string;
  status: "em_andamento" | "pausado" | "concluido";
  tempo_restante: number;
  questao_idx: number;
  respostas: RespostasSalvas;
  iniciado_em: string;
  pausado_em: string | null;
  concluido_em: string | null;
};

export type SimuladoDisponivel = {
  id: string;
  titulo: string;
  tipo: string;
  polos: string | null;
  duracao_minutos: number | null;
  data_hora: string | null;
  descricao: string | null;
  projeto_nome: string;
  projeto_sigla: string;
  sessao: SimuladoSessao | null;
};

// ─── Listar simulados disponíveis ──────────────────────────────────────────────

export async function getSimuladosDisponiveis(): Promise<SimuladoDisponivel[]> {
  const session = await getStudentSession();
  if (!session) return [];

  const db = admin();

  // ── 1. Simulados vinculados a projeto (modelo antigo: projeto_id) ────────────
  const { data: aulas } = await db
    .from("preparacao_aula")
    .select(
      "id, titulo, tipo, polos, duracao_minutos, data_hora, descricao, publicada, projeto:projeto_id(id, nome, olimpiada_sigla, publicado)",
    )
    .eq("tipo", "simulado")
    .eq("publicada", true)
    .not("projeto_id", "is", null);

  const porProjeto = (aulas ?? []).filter((a: any) => a.projeto?.publicado);

  // ── 2. Simulados standalone por série (series_elegiveis contém série do aluno) ─
  const turmaId = (session.aluno as any).turma_id;
  let porSerie: any[] = [];
  if (turmaId) {
    const { data: turmaRow } = await db.from("turma").select("serie").eq("id", turmaId).single();
    const serie = turmaRow?.serie;
    if (serie) {
      const { data: standalone } = await db
        .from("preparacao_aula")
        .select("id, titulo, tipo, polos, duracao_minutos, data_hora, descricao, publicada")
        .eq("tipo", "simulado")
        .eq("publicada", true)
        .is("projeto_id", null)
        .filter("series_elegiveis", "cs", JSON.stringify([serie]));
      porSerie = standalone ?? [];
    }
  }

  const todos = [...porProjeto, ...porSerie.map((a: any) => ({ ...a, projeto: null }))];

  if (!todos.length) return [];

  // Busca sessões do aluno
  const aulaIds = todos.map((a: any) => a.id);
  const { data: sessoes } = await db
    .from("simulado_sessao")
    .select("*")
    .eq("aluno_id", session.aluno.id)
    .in("aula_id", aulaIds);

  const sessaoMap: Record<string, SimuladoSessao> = {};
  for (const s of sessoes ?? []) sessaoMap[s.aula_id] = s;

  return todos.map((a: any) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    polos: a.polos,
    duracao_minutos: a.duracao_minutos,
    data_hora: a.data_hora,
    descricao: a.descricao,
    projeto_nome: a.projeto?.nome ?? "",
    projeto_sigla: a.projeto?.olimpiada_sigla ?? "",
    sessao: sessaoMap[a.id] ?? null,
  }));
}

// ─── Buscar ou criar sessão ────────────────────────────────────────────────────

export async function getOrCreateSessao(aulaId: string): Promise<{
  sessao: SimuladoSessao;
  questoes: any[];
  primeiraAlt: any[];
  aula: any;
} | null> {
  const session = await getStudentSession();
  if (!session) return null;

  const db = admin();

  // Busca aula
  const { data: aula } = await db
    .from("preparacao_aula")
    .select("id, titulo, duracao_minutos, polos, descricao, tipo")
    .eq("id", aulaId)
    .eq("publicada", true)
    .single();

  if (!aula) return null;

  // Busca questões vinculadas
  const { data: aulaQuestoes } = await db
    .from("preparacao_aula_questao")
    .select(
      "*, questao:questao_id(id, olimpiada, nivel, fase, ano, numero, enunciado, enunciado_blocos, imagem_url, assunto, topico, subtopico, tipo, video_url, ativo, status_cadastro)",
    )
    .eq("aula_id", aulaId)
    .eq("visivel_aluno", true)
    .order("ordem");

  const questoes = (aulaQuestoes ?? [])
    .map((aq: any) => aq.questao)
    .filter((q: any) => q && q.ativo && q.status_cadastro === "publicado");

  // Pré-carrega alternativas da primeira questão
  const primeiraAlt =
    questoes.length > 0
      ? ((
          await db
            .from("alternativa")
            .select("id, letra, texto, imagem_url, imagem_largura")
            .eq("questao_id", questoes[0].id)
            .order("letra")
        ).data ?? [])
      : [];

  // Verifica sessão existente (em_andamento ou pausado)
  const { data: sessaoExistente } = await db
    .from("simulado_sessao")
    .select("*")
    .eq("aluno_id", session.aluno.id)
    .eq("aula_id", aulaId)
    .in("status", ["em_andamento", "pausado"])
    .maybeSingle();

  if (sessaoExistente) {
    // Retoma sessão pausada
    if (sessaoExistente.status === "pausado") {
      await db
        .from("simulado_sessao")
        .update({ status: "em_andamento", pausado_em: null })
        .eq("id", sessaoExistente.id);
      return {
        sessao: { ...sessaoExistente, status: "em_andamento" },
        questoes,
        primeiraAlt,
        aula,
      };
    }
    return { sessao: sessaoExistente, questoes, primeiraAlt, aula };
  }

  // Cria nova sessão
  const tempoInicial = aula.duracao_minutos ?? 3600; // segundos
  const { data: novaSessao } = await db
    .from("simulado_sessao")
    .insert({
      aluno_id: session.aluno.id,
      aula_id: aulaId,
      status: "em_andamento",
      tempo_restante: tempoInicial,
      questao_idx: 0,
      respostas: {},
    })
    .select()
    .single();

  return { sessao: novaSessao!, questoes, primeiraAlt, aula };
}

// ─── Salvar progresso ──────────────────────────────────────────────────────────

export async function salvarProgresso(
  sessaoId: string,
  tempoRestante: number,
  questaoIdx: number,
  respostas: RespostasSalvas,
): Promise<void> {
  const session = await getStudentSession();
  if (!session) return;
  const db = admin();
  const { data: sessao } = await db
    .from("simulado_sessao")
    .select("id, aula_id, status")
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id)
    .maybeSingle();
  if (!sessao || sessao.status === "concluido") return;

  const respostasSanitizadas = await sanitizarRespostasDoSimulado(db, sessao.aula_id, respostas);
  await db
    .from("simulado_sessao")
    .update({
      tempo_restante: normalizarInteiroNaoNegativo(tempoRestante),
      questao_idx: normalizarInteiroNaoNegativo(questaoIdx),
      respostas: respostasSanitizadas,
    })
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id);
}

// ─── Pausar simulado ───────────────────────────────────────────────────────────

export async function pausarSimulado(
  sessaoId: string,
  tempoRestante: number,
  questaoIdx: number,
  respostas: RespostasSalvas,
): Promise<void> {
  const session = await getStudentSession();
  if (!session) return;
  const db = admin();
  const { data: sessao } = await db
    .from("simulado_sessao")
    .select("id, aula_id, status")
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id)
    .maybeSingle();
  if (!sessao || sessao.status === "concluido") return;

  const respostasSanitizadas = await sanitizarRespostasDoSimulado(db, sessao.aula_id, respostas);
  await db
    .from("simulado_sessao")
    .update({
      status: "pausado",
      tempo_restante: normalizarInteiroNaoNegativo(tempoRestante),
      questao_idx: normalizarInteiroNaoNegativo(questaoIdx),
      respostas: respostasSanitizadas,
      pausado_em: new Date().toISOString(),
    })
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id);
  revalidatePath("/aluno/simulados");
}

// ─── Finalizar simulado ────────────────────────────────────────────────────────

export async function finalizarSimulado(
  sessaoId: string,
  aulaId: string,
  tempoUsado: number,
  respostas: RespostasSalvas,
): Promise<void> {
  const session = await getStudentSession();
  if (!session) return;
  const db = admin();
  const { data: sessao } = await db
    .from("simulado_sessao")
    .select("id, aula_id, status")
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id)
    .eq("aula_id", aulaId)
    .maybeSingle();
  if (!sessao || sessao.status === "concluido") return;

  const respostasSanitizadas = await sanitizarRespostasDoSimulado(db, sessao.aula_id, respostas);

  // Registra respostas em resposta_aluno com contexto simulado
  const inserts = Object.entries(respostasSanitizadas).map(([questao_id, r]) => ({
    aluno_id: session.aluno.id,
    questao_id,
    alternativa_id: r.alternativa_id || null,
    correta: r.correta,
    contexto: "simulado",
    aula_id: sessao.aula_id,
  }));

  if (inserts.length > 0) {
    await db.from("resposta_aluno").insert(inserts);
  }

  // Marca sessão como concluída
  await db
    .from("simulado_sessao")
    .update({
      status: "concluido",
      respostas: respostasSanitizadas,
      concluido_em: new Date().toISOString(),
    })
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id);

  revalidatePath("/aluno/simulados");
}

// ─── Relatório de desempenho ───────────────────────────────────────────────────

export async function getRelatorioSimulado(sessaoId: string) {
  const session = await getStudentSession();
  if (!session) return null;

  const db = admin();

  const { data: sessao } = await db
    .from("simulado_sessao")
    .select("*")
    .eq("id", sessaoId)
    .eq("aluno_id", session.aluno.id)
    .single();

  if (!sessao || sessao.status !== "concluido") return null;

  const respostas: RespostasSalvas = sessao.respostas ?? {};
  const questaoIds = Object.keys(respostas);

  if (questaoIds.length === 0) return { sessao, porTopico: [], total: 0, acertos: 0 };

  const { data: questoes } = await db
    .from("questao")
    .select("id, topico, subtopico, assunto")
    .in("id", questaoIds);

  const qMap: Record<string, any> = {};
  for (const q of questoes ?? []) qMap[q.id] = q;

  const total = questaoIds.length;
  const acertos = questaoIds.filter((id) => respostas[id]?.correta).length;

  // Por tópico
  const porTopico: Record<
    string,
    {
      topico: string;
      subtopicos: Record<string, { total: number; acertos: number }>;
      total: number;
      acertos: number;
    }
  > = {};
  for (const id of questaoIds) {
    const q = qMap[id];
    const topico = q?.topico ?? q?.assunto ?? "Sem tópico";
    const subtopico = q?.subtopico ?? "Sem subtópico";
    if (!porTopico[topico]) porTopico[topico] = { topico, subtopicos: {}, total: 0, acertos: 0 };
    porTopico[topico].total++;
    if (respostas[id]?.correta) porTopico[topico].acertos++;
    if (!porTopico[topico].subtopicos[subtopico])
      porTopico[topico].subtopicos[subtopico] = { total: 0, acertos: 0 };
    porTopico[topico].subtopicos[subtopico].total++;
    if (respostas[id]?.correta) porTopico[topico].subtopicos[subtopico].acertos++;
  }

  return {
    sessao,
    total,
    acertos,
    porTopico: Object.values(porTopico).sort((a, b) => a.acertos / a.total - b.acertos / b.total),
  };
}

export async function getSessaoConcluida(aulaId: string) {
  const session = await getStudentSession();
  if (!session) return null;
  const db = admin();
  const { data: aula } = await db
    .from("preparacao_aula")
    .select("id, titulo, duracao_minutos, polos, descricao, tipo")
    .eq("id", aulaId)
    .single();
  if (!aula) return null;
  const { data: sessao } = await db
    .from("simulado_sessao")
    .select("*")
    .eq("aluno_id", session.aluno.id)
    .eq("aula_id", aulaId)
    .eq("status", "concluido")
    .order("concluido_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return sessao ? { sessao, aula } : null;
}
