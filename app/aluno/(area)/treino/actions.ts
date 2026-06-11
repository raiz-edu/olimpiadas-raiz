/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  avaliarRespostaAberta,
  avaliarRespostaAbertaComImagem,
  avaliarFotoAberta,
} from "@/lib/ai/groq";
import type { FeedbackIA } from "@/lib/ai/types";

// ─── Questões para treino ────────────────────────────────────────────────────

export async function getTopicosDisponiveis() {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("questao")
    .select("olimpiada, topico, subtopico")
    .eq("ativo", true);
  const rows: { olimpiada: string | null; topico: string | null; subtopico: string | null }[] =
    data ?? [];

  const olimpiadas = [...new Set(rows.map((r) => r.olimpiada).filter(Boolean))].sort() as string[];

  // topicosMap[""] = todos os tópicos; topicosMap["obmep"] = tópicos só daquela origem
  const topicosMap: Record<string, string[]> = { "": [] };
  const subtopicosMap: Record<string, string[]> = {};
  const allTopicos = topicosMap[""] as string[];

  for (const r of rows) {
    if (!r.topico) continue;
    // bucket global
    if (!allTopicos.includes(r.topico)) allTopicos.push(r.topico);
    // bucket por origem
    if (r.olimpiada) {
      const b = topicosMap[r.olimpiada] ?? (topicosMap[r.olimpiada] = []);
      if (!b.includes(r.topico)) b.push(r.topico);
    }
    // subtópicos
    if (r.subtopico) {
      const s = subtopicosMap[r.topico] ?? (subtopicosMap[r.topico] = []);
      if (!s.includes(r.subtopico)) s.push(r.subtopico);
    }
  }
  for (const key of Object.keys(topicosMap)) topicosMap[key]?.sort();
  for (const key of Object.keys(subtopicosMap)) subtopicosMap[key]?.sort();

  return { olimpiadas, topicosMap, subtopicosMap };
}

// Sessão de treino: tamanho fixo + distribuição por grau de dificuldade.
// A seleção dentro de cada faixa é aleatória — assim, novas sessões com os
// mesmos filtros tendem a trazer questões diferentes do banco disponível.
const TAMANHO_SESSAO = 10;
const DISTRIBUICAO_DIFICULDADE: { chave: string; qtd: number }[] = [
  { chave: "elementar", qtd: 2 },
  { chave: "facil", qtd: 2 },
  { chave: "medio", qtd: 3 },
  { chave: "dificil", qtd: 2 },
  { chave: "muito_dificil", qtd: 1 },
];

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = tmp;
  }
  return copia;
}

export type SessaoTreino = {
  questoes: any[];
  totalDisponivel: number;
};

export async function getQuestoesTreino(filtros: {
  olimpiada?: string;
  nivel?: string;
  fase?: number;
  ano?: number;
  topico?: string;
  subtopico?: string;
  assunto?: string;
  modo?: "sequencial" | "aleatorio";
}): Promise<SessaoTreino> {
  const session = await getStudentSession();
  if (!session) return { questoes: [], totalDisponivel: 0 };

  const supabase = createAdminClient() as any;

  let query = supabase
    .from("questao")
    .select(
      "id, olimpiada, nivel, fase, ano, numero, enunciado, enunciado_blocos, imagem_url, assunto, topico, subtopico, tipo, video_url, dificuldade",
    )
    .eq("ativo", true);

  if (filtros.olimpiada) query = query.eq("olimpiada", filtros.olimpiada);
  if (filtros.nivel) query = query.eq("nivel", filtros.nivel);
  if (filtros.fase) query = query.eq("fase", filtros.fase);
  if (filtros.ano) query = query.eq("ano", filtros.ano);
  if (filtros.topico) query = query.eq("topico", filtros.topico);
  if (filtros.subtopico) query = query.eq("subtopico", filtros.subtopico);
  if (filtros.assunto) query = query.ilike("assunto", `%${filtros.assunto}%`);

  const { data } = await query.limit(500);
  const pool: any[] = data ?? [];
  if (pool.length === 0) return { questoes: [], totalDisponivel: 0 };

  // Embaralha o pool uma vez — a ordem aqui decide quais questões "ganham"
  // dentro de cada faixa de dificuldade quando há mais disponíveis que a cota.
  const embaralhado = embaralhar(pool);
  const porDificuldade: Record<string, any[]> = {};
  for (const q of embaralhado) {
    const chave = (q as any).dificuldade ?? "sem_dificuldade";
    (porDificuldade[chave] ??= []).push(q);
  }

  const selecionadas: any[] = [];
  const usadas = new Set<string>();
  for (const { chave, qtd } of DISTRIBUICAO_DIFICULDADE) {
    const pegas = (porDificuldade[chave] ?? []).slice(0, qtd);
    for (const q of pegas) usadas.add(q.id);
    selecionadas.push(...pegas);
  }

  // Faixas sub-representadas no filtro atual: completa a sessão com quaisquer
  // questões restantes do pool (ainda embaralhado), até atingir o tamanho alvo.
  if (selecionadas.length < TAMANHO_SESSAO) {
    const restantes = embaralhado.filter((q) => !usadas.has(q.id));
    const faltam = TAMANHO_SESSAO - selecionadas.length;
    selecionadas.push(...restantes.slice(0, faltam));
  }

  // Ordena a APRESENTAÇÃO conforme o modo escolhido (a seleção em si já é aleatória)
  const final =
    filtros.modo === "aleatorio"
      ? embaralhar(selecionadas)
      : [...selecionadas].sort(
          (a, b) =>
            a.olimpiada.localeCompare(b.olimpiada) ||
            (a.fase ?? 0) - (b.fase ?? 0) ||
            a.ano - b.ano ||
            a.numero - b.numero,
        );

  return { questoes: final, totalDisponivel: pool.length };
}

export async function getAlternativasQuestao(questaoId: string) {
  const session = await getStudentSession();
  if (!session) return [];

  const supabase = createAdminClient() as any;
  // Retorna apenas id, letra e texto — NÃO retorna "correta" para o client
  const { data } = await supabase
    .from("alternativa")
    .select("id, letra, texto, imagem_url, imagem_largura")
    .eq("questao_id", questaoId)
    .order("letra");
  return data ?? [];
}

// ─── Responder questão ───────────────────────────────────────────────────────

export type RespostaState =
  | { correta: boolean; alternativa_correta_id: string | null; questao_id: string }
  | { error: string }
  | null;

export async function responderQuestao(
  _prev: RespostaState,
  formData: FormData,
): Promise<RespostaState> {
  const session = await getStudentSession();
  if (!session) return { error: "Não autenticado" };

  const questao_id = formData.get("questao_id") as string;
  const alternativa_id = formData.get("alternativa_id") as string;
  const contexto = (formData.get("contexto") as string) || "banco";
  const aula_id = (formData.get("aula_id") as string) || null;

  if (!questao_id || !alternativa_id) return { error: "Dados inválidos" };

  // Verifica resposta NO SERVIDOR via adminClient — campo "correta" nunca vai ao client

  const admin = createAdminClient() as any;
  const { data: alt } = await admin
    .from("alternativa")
    .select("correta, questao_id")
    .eq("id", alternativa_id)
    .single();

  if (!alt || alt.questao_id !== questao_id) return { error: "Alternativa inválida" };

  const correta: boolean = alt.correta === true;

  // Busca alternativa correta para exibir no gabarito
  const { data: altCorreta } = await admin
    .from("alternativa")
    .select("id")
    .eq("questao_id", questao_id)
    .eq("correta", true)
    .single();

  // Registra resposta com contexto
  await admin.from("resposta_aluno").insert({
    aluno_id: session.aluno.id,
    questao_id,
    alternativa_id,
    correta,
    contexto,
    aula_id,
  });

  return { correta, alternativa_correta_id: altCorreta?.id ?? null, questao_id };
}

// ─── Solução (revelada apenas após responder) ────────────────────────────────

export async function getSolucaoQuestao(questaoId: string) {
  const session = await getStudentSession();
  if (!session) return null;

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("solucao")
    .select("texto, imagem_url, imagem_largura, blocos")
    .eq("questao_id", questaoId)
    .maybeSingle();
  return data;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function deduplicarPorQuestao(raw: any[]) {
  const visto = new Set<string>();
  return raw.filter((r: any) => {
    const key = `${r.questao_id}-${r.contexto ?? "banco"}-${r.aula_id ?? ""}`;
    if (visto.has(key)) return false;
    visto.add(key);
    return true;
  });
}

function agruparPorTopico(items: any[]) {
  const mapa: Record<string, { total: number; acertos: number }> = {};
  for (const r of items) {
    const key = r.questao?.topico ?? r.questao?.assunto ?? "Sem tópico";
    if (!mapa[key]) mapa[key] = { total: 0, acertos: 0 };
    mapa[key].total++;
    if (r.correta) mapa[key].acertos++;
  }
  return Object.entries(mapa)
    .map(([topico, v]) => ({ topico, ...v, erros: v.total - v.acertos }))
    .sort((a, b) => a.acertos / a.total - b.acertos / b.total);
}

export async function getDashboardAluno() {
  const session = await getStudentSession();
  if (!session) {
    return { banco: null, aulas: null, simulados: null, total_geral: 0, acertos_geral: 0 };
  }

  const admin = createAdminClient() as any;

  const { data: raw } = await admin
    .from("resposta_aluno")
    .select(
      "questao_id, correta, contexto, aula_id, respondido_em, questao:questao_id(olimpiada, nivel, topico, assunto)",
    )
    .eq("aluno_id", session.aluno.id)
    .order("respondido_em", { ascending: false });

  const todas = deduplicarPorQuestao(raw ?? []);

  // ── Banco de Questões (livre) ──────────────────────────────────────────────
  const doBanco = todas.filter((r: any) => (r.contexto ?? "banco") === "banco");
  const bancoPorTopico = agruparPorTopico(doBanco);

  // ── Aulas ──────────────────────────────────────────────────────────────────
  const deAulas = todas.filter((r: any) => r.contexto === "aula");

  // ── Simulados ──────────────────────────────────────────────────────────────
  const deSimulados = todas.filter((r: any) => r.contexto === "simulado");

  // Busca nomes das aulas/simulados
  const aulaIds = [
    ...new Set(
      [...deAulas.map((r: any) => r.aula_id), ...deSimulados.map((r: any) => r.aula_id)].filter(
        Boolean,
      ),
    ),
  ];

  const aulasMeta: Record<string, { titulo: string; tipo: string }> = {};
  if (aulaIds.length > 0) {
    const { data: aulasData } = await admin
      .from("preparacao_aula")
      .select("id, titulo, tipo")
      .in("id", aulaIds);
    for (const a of aulasData ?? []) {
      aulasMeta[a.id] = { titulo: a.titulo, tipo: a.tipo };
    }
  }

  // ── Sessões de simulado (tempo + data) ────────────────────────────────────
  const simAulaIds = [...new Set(deSimulados.map((r: any) => r.aula_id).filter(Boolean))];
  const sessaoSimMap: Record<
    string,
    { concluido_em: string | null; tempo_restante: number; duracao: number }
  > = {};

  if (simAulaIds.length > 0) {
    const [{ data: sessoes }, { data: aulasSimulado }] = await Promise.all([
      admin
        .from("simulado_sessao")
        .select("aula_id, concluido_em, tempo_restante")
        .eq("aluno_id", session.aluno.id)
        .eq("status", "concluido")
        .in("aula_id", simAulaIds),
      admin.from("preparacao_aula").select("id, duracao_minutos").in("id", simAulaIds),
    ]);
    for (const s of sessoes ?? []) {
      sessaoSimMap[s.aula_id] = {
        concluido_em: s.concluido_em,
        tempo_restante: s.tempo_restante,
        duracao: 0,
      };
    }
    for (const a of aulasSimulado ?? []) {
      const entry = sessaoSimMap[a.id];
      if (entry) entry.duracao = a.duracao_minutos ?? 0;
    }
  }

  // Por simulado detalhado
  const porSimuladoMapa: Record<string, any> = {};
  for (const r of deSimulados) {
    const key = (r as any).aula_id ?? "desconhecido";
    if (!porSimuladoMapa[key]) {
      const sess = sessaoSimMap[key];
      porSimuladoMapa[key] = {
        aula_id: key,
        titulo: aulasMeta[key]?.titulo ?? "Simulado",
        total: 0,
        acertos: 0,
        concluido_em: sess?.concluido_em ?? null,
        tempo_usado: sess ? Math.max(0, (sess.duracao ?? 0) - (sess.tempo_restante ?? 0)) : null,
      };
    }
    porSimuladoMapa[key].total++;
    if ((r as any).correta) porSimuladoMapa[key].acertos++;
  }
  const porSimuladoDetalhe = Object.values(porSimuladoMapa).sort((a: any, b: any) =>
    (b.concluido_em ?? "").localeCompare(a.concluido_em ?? ""),
  );

  const total_geral = todas.length;
  const acertos_geral = todas.filter((r: any) => r.correta).length;

  return {
    total_geral,
    acertos_geral,
    banco: {
      total: doBanco.length,
      acertos: doBanco.filter((r: any) => r.correta).length,
      por_topico: bancoPorTopico,
    },
    aulas: {
      total: deAulas.length,
      acertos: deAulas.filter((r: any) => r.correta).length,
      por_topico: agruparPorTopico(deAulas),
    },
    simulados: {
      total: deSimulados.length,
      acertos: deSimulados.filter((r: any) => r.correta).length,
      por_topico: agruparPorTopico(deSimulados),
      por_simulado: porSimuladoDetalhe,
    },
  };
}

export async function getUltimasErradas(limit = 10) {
  const session = await getStudentSession();
  if (!session) return [];

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("resposta_aluno")
    .select(
      "questao_id, respondido_em, questao:questao_id(olimpiada, nivel, fase, ano, numero, assunto, topico)",
    )
    .eq("aluno_id", session.aluno.id)
    .eq("correta", false)
    .order("respondido_em", { ascending: false })
    .limit(limit * 3); // busca extra para deduplicar

  const visto = new Set<string>();
  const deduped = (data ?? []).filter((r: any) => {
    if (visto.has(r.questao_id)) return false;
    visto.add(r.questao_id);
    return true;
  });

  return deduped.slice(0, limit);
}

// ─── Responder questão aberta ────────────────────────────────────────────────

export type RespostaAbertaState =
  | { feedback: FeedbackIA; questao_id: string }
  | { questao_id: string }
  | { error: string }
  | null;

export async function responderQuestaoAberta(
  _prev: RespostaAbertaState,
  formData: FormData,
): Promise<RespostaAbertaState> {
  const session = await getStudentSession();
  if (!session) return { error: "Não autenticado" };

  const questao_id = formData.get("questao_id") as string;
  const resposta_texto = ((formData.get("resposta_texto") as string) ?? "").trim();
  const imagem_base64 = ((formData.get("imagem_base64") as string) ?? "").trim();
  const contexto = (formData.get("contexto") as string) || "banco";
  const aula_id = (formData.get("aula_id") as string) || null;

  if (!questao_id || (!resposta_texto && !imagem_base64)) {
    return { error: "Escreva sua resposta ou anexe uma foto antes de enviar." };
  }

  const respostaRegistrada = resposta_texto || "[Resposta enviada por foto]";

  const admin = createAdminClient() as any;

  const [{ data: questao }, { data: solucao }] = await Promise.all([
    admin.from("questao").select("enunciado").eq("id", questao_id).single(),
    admin.from("solucao").select("texto, blocos").eq("questao_id", questao_id).maybeSingle(),
  ]);

  const blocos =
    (solucao?.blocos as Array<{ tipo: string; conteudo?: string; url?: string }> | null) ?? [];

  const textoSolucao =
    solucao?.texto ||
    blocos
      .filter((b) => b.tipo === "texto")
      .map((b) => b.conteudo ?? "")
      .join("\n")
      .trim() ||
    "";

  const imagensSolucao = blocos
    .filter((b) => b.tipo === "imagem" && b.url)
    .map((b) => b.url as string);

  if (!textoSolucao && imagensSolucao.length === 0) {
    await admin.from("resposta_aluno").insert({
      aluno_id: session.aluno.id,
      questao_id,
      resposta_texto: respostaRegistrada,
      correta: false,
      contexto,
      aula_id,
    });
    return { questao_id };
  }

  let feedback: FeedbackIA;
  try {
    feedback = imagem_base64
      ? await avaliarFotoAberta(
          questao?.enunciado ?? "",
          textoSolucao,
          imagensSolucao,
          imagem_base64,
        )
      : textoSolucao
        ? await avaliarRespostaAberta(questao?.enunciado ?? "", textoSolucao, resposta_texto)
        : await avaliarRespostaAbertaComImagem(
            questao?.enunciado ?? "",
            imagensSolucao,
            resposta_texto,
          );
  } catch {
    await admin.from("resposta_aluno").insert({
      aluno_id: session.aluno.id,
      questao_id,
      resposta_texto: respostaRegistrada,
      correta: false,
      contexto,
      aula_id,
    });
    return { error: "Avaliação temporariamente indisponível. Resposta registrada." };
  }

  const correta = feedback.itens.length > 0 && feedback.itens.every((i) => i.status === "correto");

  await admin.from("resposta_aluno").insert({
    aluno_id: session.aluno.id,
    questao_id,
    resposta_texto: respostaRegistrada,
    correta,
    feedback_ia: feedback,
    contexto,
    aula_id,
  });

  return { feedback, questao_id };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getRespostaAluno(questaoId: string) {
  const session = await getStudentSession();
  if (!session) return null;

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("resposta_aluno")
    .select("correta, alternativa_id")
    .eq("aluno_id", session.aluno.id)
    .eq("questao_id", questaoId)
    .order("respondido_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
