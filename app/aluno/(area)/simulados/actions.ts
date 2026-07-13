/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/auth/student-session";
import { revalidatePath } from "next/cache";
import { sanitizeRespostasSimulado } from "@/lib/aluno/security";
import {
  escolherProjetoVisivelDoSimulado,
  getSimuladoProjetoIds,
  isSimuladoDisponivelParaAluno,
  type AlunoSimuladoAccessContext,
  type ProjetoAccessRow,
} from "@/lib/aluno/simulado-access";

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

type SimuladoAulaRow = {
  id: string;
  titulo: string;
  tipo: string;
  polos: string | null;
  duracao_minutos: number | null;
  data_hora: string | null;
  descricao: string | null;
  publicada: boolean;
  projeto_id: string | null;
  projeto_ids: string[] | null;
  turma_ids: string[] | null;
  series_elegiveis: string[] | null;
};

async function getContextoAcessoSimulado(
  db: any,
  session: NonNullable<Awaited<ReturnType<typeof getStudentSession>>>,
): Promise<AlunoSimuladoAccessContext> {
  const turmaId = (session.aluno as any).turma_id ?? null;
  let turmaSerie: string | null = null;

  if (turmaId) {
    const { data: turma } = await db.from("turma").select("serie").eq("id", turmaId).maybeSingle();
    turmaSerie = turma?.serie ?? null;
  }

  const { data: inscricoes } = await db
    .from("inscricao")
    .select("olimpiada_id")
    .eq("aluno_id", session.aluno.id)
    .eq("status", "confirmada");

  return {
    turmaId,
    alunoSerie: (session.aluno as any).serie ?? null,
    turmaSerie,
    olimpiadaIdsConfirmadas: new Set(
      (inscricoes ?? [])
        .map((inscricao: any) => inscricao.olimpiada_id)
        .filter((id: unknown): id is string => typeof id === "string"),
    ),
  };
}

async function getProjetosPorId(
  db: any,
  simulados: SimuladoAulaRow[],
): Promise<Map<string, ProjetoAccessRow>> {
  const projetoIds = [...new Set(simulados.flatMap((simulado) => getSimuladoProjetoIds(simulado)))];
  if (projetoIds.length === 0) return new Map();

  const { data: projetos } = await db
    .from("preparacao_projeto")
    .select("id, nome, olimpiada_sigla, olimpiada_id, publicado, ativo")
    .in("id", projetoIds);

  return new Map((projetos ?? []).map((projeto: ProjetoAccessRow) => [projeto.id, projeto]));
}

async function getSimuladosPermitidos(
  db: any,
  session: NonNullable<Awaited<ReturnType<typeof getStudentSession>>>,
): Promise<Array<SimuladoAulaRow & { projeto_visivel: ProjetoAccessRow | null }>> {
  const { data: aulas } = await db
    .from("preparacao_aula")
    .select(
      "id, titulo, tipo, polos, duracao_minutos, data_hora, descricao, publicada, projeto_id, projeto_ids, turma_ids, series_elegiveis",
    )
    .eq("tipo", "simulado")
    .eq("publicada", true);

  const simulados = (aulas ?? []) as SimuladoAulaRow[];
  if (simulados.length === 0) return [];

  const [contexto, projetosPorId] = await Promise.all([
    getContextoAcessoSimulado(db, session),
    getProjetosPorId(db, simulados),
  ]);

  return simulados
    .filter((simulado) => isSimuladoDisponivelParaAluno(simulado, contexto, projetosPorId))
    .map((simulado) => ({
      ...simulado,
      projeto_visivel: escolherProjetoVisivelDoSimulado(simulado, contexto, projetosPorId),
    }))
    .sort((a, b) => {
      if (a.data_hora && b.data_hora) return a.data_hora.localeCompare(b.data_hora);
      if (a.data_hora) return -1;
      if (b.data_hora) return 1;
      return a.titulo.localeCompare(b.titulo);
    });
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
  const todosPermitidos = await getSimuladosPermitidos(db, session);
  if (!todosPermitidos.length) return [];

  const aulaIdsPermitidos = todosPermitidos.map((a) => a.id);
  const { data: sessoesPermitidas } = await db
    .from("simulado_sessao")
    .select("*")
    .eq("aluno_id", session.aluno.id)
    .in("aula_id", aulaIdsPermitidos);

  const sessaoPermitidaMap: Record<string, SimuladoSessao> = {};
  for (const s of sessoesPermitidas ?? []) sessaoPermitidaMap[s.aula_id] = s;

  return todosPermitidos.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    polos: a.polos,
    duracao_minutos: a.duracao_minutos,
    data_hora: a.data_hora,
    descricao: a.descricao,
    projeto_nome: a.projeto_visivel?.nome ?? "",
    projeto_sigla: a.projeto_visivel?.olimpiada_sigla ?? "",
    sessao: sessaoPermitidaMap[a.id] ?? null,
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
  const simuladosPermitidos = await getSimuladosPermitidos(db, session);
  if (!simuladosPermitidos.some((simulado) => simulado.id === aulaId)) return null;

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
