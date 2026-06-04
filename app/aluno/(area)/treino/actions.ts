/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/auth/student-session";

// ─── Questões para treino ────────────────────────────────────────────────────

export async function getTopicosDisponiveis() {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("questao")
    .select("topico, subtopico")
    .eq("ativo", true)
    .not("topico", "is", null);
  const rows: { topico: string; subtopico: string | null }[] = data ?? [];
  const topicos = [...new Set(rows.map((r) => r.topico).filter(Boolean))].sort();
  const subtopicosMap: Record<string, string[]> = {};
  for (const r of rows) {
    if (!r.topico || !r.subtopico) continue;
    const bucket = subtopicosMap[r.topico] ?? (subtopicosMap[r.topico] = []);
    if (!bucket.includes(r.subtopico)) bucket.push(r.subtopico);
  }
  for (const t of topicos) subtopicosMap[t]?.sort();
  return { topicos, subtopicosMap };
}

export async function getQuestoesTreino(filtros: {
  olimpiada?: string;
  nivel?: string;
  fase?: number;
  ano?: number;
  topico?: string;
  subtopico?: string;
  assunto?: string;
  modo?: "sequencial" | "aleatorio";
  limit?: number;
}) {
  const session = await getStudentSession();
  if (!session) return [];

  const supabase = createAdminClient() as any;

  let query = supabase
    .from("questao")
    .select(
      "id, olimpiada, nivel, fase, ano, numero, enunciado, enunciado_blocos, imagem_url, assunto, topico, subtopico, tipo, video_url",
    )
    .eq("ativo", true);

  if (filtros.olimpiada) query = query.eq("olimpiada", filtros.olimpiada);
  if (filtros.nivel) query = query.eq("nivel", filtros.nivel);
  if (filtros.fase) query = query.eq("fase", filtros.fase);
  if (filtros.ano) query = query.eq("ano", filtros.ano);
  if (filtros.topico) query = query.eq("topico", filtros.topico);
  if (filtros.subtopico) query = query.eq("subtopico", filtros.subtopico);
  if (filtros.assunto) query = query.ilike("assunto", `%${filtros.assunto}%`);

  if (filtros.modo === "aleatorio") {
    // Supabase não suporta RANDOM() nativamente — busca tudo e embaralha no servidor
    const { data } = await query.limit(200);
    const lista = data ?? [];
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista.slice(0, filtros.limit ?? 20);
  }

  query = query.order("olimpiada").order("fase").order("ano").order("numero");
  const { data } = await query.limit(filtros.limit ?? 20);
  return data ?? [];
}

export async function getAlternativasQuestao(questaoId: string) {
  const session = await getStudentSession();
  if (!session) return [];

  const supabase = createAdminClient() as any;
  // Retorna apenas id, letra e texto — NÃO retorna "correta" para o client
  const { data } = await supabase
    .from("alternativa")
    .select("id, letra, texto, imagem_url")
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
    .select("texto, imagem_url")
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

  function agruparPorAula(items: any[]) {
    const mapa: Record<
      string,
      { aula_id: string; titulo: string; total: number; acertos: number }
    > = {};
    for (const r of items) {
      const key = r.aula_id ?? "desconhecida";
      if (!mapa[key])
        mapa[key] = {
          aula_id: key,
          titulo: aulasMeta[key]?.titulo ?? "Aula desconhecida",
          total: 0,
          acertos: 0,
        };
      mapa[key].total++;
      if (r.correta) mapa[key].acertos++;
    }
    return Object.values(mapa).sort((a, b) => a.acertos / a.total - b.acertos / b.total);
  }

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
      por_aula: agruparPorAula(deAulas),
    },
    simulados: {
      total: deSimulados.length,
      acertos: deSimulados.filter((r: any) => r.correta).length,
      por_simulado: agruparPorAula(deSimulados),
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
