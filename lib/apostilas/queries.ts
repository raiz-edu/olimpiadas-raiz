// Leituras do módulo Apostilas (server-only; adminClient — RLS sem policies).

import { createAdminClient } from "@/lib/supabase/admin";
import { paresDasSeries } from "@/lib/questoes/series";
import type {
  ExcluirAplicadas,
  LinhaBalanco,
  ReceitaConfig,
  VersoesGeracao,
} from "@/lib/apostilas/receita";

export const NOME_MODULO_CHAVE = "apostilas_nome_modulo";
export const NOME_MODULO_DEFAULT = "Apostilas";

export async function getNomeModulo(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("configuracao_sistema")
    .select("valor")
    .eq("chave", NOME_MODULO_CHAVE)
    .maybeSingle();
  return data?.valor?.trim() || NOME_MODULO_DEFAULT;
}

export type ReceitaRow = {
  id: string;
  nome: string;
  titulo: string;
  subtitulo: string | null;
  config: ReceitaConfig;
  criado_em: string;
  atualizado_em: string;
};

export type GeracaoRow = {
  id: string;
  receita_id: string;
  seed: number;
  total_questoes: number;
  balanco: LinhaBalanco[];
  versoes: VersoesGeracao;
  gerado_em: string;
};

export async function getReceitas(): Promise<(ReceitaRow & { ultima: GeracaoRow | null })[]> {
  const admin = createAdminClient();
  const { data: receitas, error } = await admin
    .from("apostila_receita")
    .select("id, nome, titulo, subtitulo, config, criado_em, atualizado_em")
    .order("atualizado_em", { ascending: false });
  if (error) throw new Error(error.message);
  const { data: geracoes } = await admin
    .from("apostila_geracao")
    .select("id, receita_id, seed, total_questoes, balanco, versoes, gerado_em")
    .order("gerado_em", { ascending: false });
  const ultimaPor = new Map<string, GeracaoRow>();
  for (const g of (geracoes ?? []) as GeracaoRow[]) {
    if (!ultimaPor.has(g.receita_id)) ultimaPor.set(g.receita_id, g);
  }
  return ((receitas ?? []) as ReceitaRow[]).map((r) => ({
    ...r,
    ultima: ultimaPor.get(r.id) ?? null,
  }));
}

export type AplicacaoRow = {
  id: string;
  geracao_id: string;
  aplicado_em: string;
  observacao: string | null;
  rotulo: string; // "Marca · Unidade · Turma (série, ano)" — partes ausentes omitidas
};

export async function getReceita(id: string): Promise<
  | (ReceitaRow & {
      geracoes: GeracaoRow[];
      aplicacoesPorGeracao: Record<string, AplicacaoRow[]>;
    })
  | null
> {
  const admin = createAdminClient();
  const { data: receita } = await admin
    .from("apostila_receita")
    .select("id, nome, titulo, subtitulo, config, criado_em, atualizado_em")
    .eq("id", id)
    .maybeSingle();
  if (!receita) return null;
  const { data: geracoes } = await admin
    .from("apostila_geracao")
    .select("id, receita_id, seed, total_questoes, balanco, versoes, gerado_em")
    .eq("receita_id", id)
    .order("gerado_em", { ascending: false });
  const lista = (geracoes ?? []) as GeracaoRow[];

  const aplicacoesPorGeracao: Record<string, AplicacaoRow[]> = {};
  if (lista.length) {
    const { data: aplicacoes } = await admin
      .from("apostila_aplicacao")
      .select(
        "id, geracao_id, aplicado_em, observacao, " +
          "marca:marca_id(nome), unidade:unidade_id(nome), turma:turma_id(nome, serie, ano_letivo)",
      )
      .in(
        "geracao_id",
        lista.map((g) => g.id),
      )
      .order("aplicado_em", { ascending: false });
    // o select com joins embutidos derrota a inferência do supabase-js — cast
    // no padrão do repo (unwrap manual logo abaixo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of (aplicacoes ?? []) as any[]) {
      // joins podem vir como array ou objeto — unwrap (gotcha do projeto)
      const marca = Array.isArray(a.marca) ? a.marca[0] : a.marca;
      const unidade = Array.isArray(a.unidade) ? a.unidade[0] : a.unidade;
      const turma = Array.isArray(a.turma) ? a.turma[0] : a.turma;
      const rotulo = [
        marca?.nome,
        unidade?.nome,
        turma ? `${turma.nome} (${turma.serie}, ${turma.ano_letivo})` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      (aplicacoesPorGeracao[a.geracao_id] ??= []).push({
        id: a.id,
        geracao_id: a.geracao_id,
        aplicado_em: a.aplicado_em,
        observacao: a.observacao,
        rotulo,
      });
    }
  }
  return { ...(receita as ReceitaRow), geracoes: lista, aplicacoesPorGeracao };
}

export type OpcoesAplicacao = {
  marcas: { id: string; nome: string }[];
  unidades: { id: string; rotulo: string }[];
  turmas: { id: string; rotulo: string }[];
};

/** Marcas/unidades/turmas ativas com rótulo de contexto — alimenta o form de
 * aplicação (detalhe) e o card de exclusão do construtor. */
export async function getOpcoesAplicacao(): Promise<OpcoesAplicacao> {
  const admin = createAdminClient();
  const [{ data: marcas }, { data: unidades }, { data: turmas }] = await Promise.all([
    admin.from("marca").select("id, nome").eq("ativo", true).order("nome"),
    admin.from("unidade").select("id, nome, marca_id").eq("ativo", true).order("nome"),
    admin
      .from("turma")
      .select("id, nome, serie, ano_letivo, unidade_id")
      .eq("ativo", true)
      .order("nome"),
  ]);
  const nomeMarca = new Map((marcas ?? []).map((m) => [m.id, m.nome]));
  const infoUnidade = new Map(
    (unidades ?? []).map((u) => [u.id, `${nomeMarca.get(u.marca_id) ?? "?"} · ${u.nome}`]),
  );
  return {
    marcas: marcas ?? [],
    unidades: (unidades ?? []).map((u) => ({ id: u.id, rotulo: infoUnidade.get(u.id)! })),
    turmas: (turmas ?? []).map((t) => ({
      id: t.id,
      rotulo: `${infoUnidade.get(t.unidade_id) ?? "?"} · ${t.nome} (${t.serie}, ${t.ano_letivo})`,
    })),
  };
}

/** Questões que os alvos de `excluir_aplicadas` já receberam (cadeia aplicação ->
 * geração -> apostila_questao). Mesma semântica da skill. */
export async function questoesJaAplicadas(
  excluir: ExcluirAplicadas | undefined,
): Promise<Set<string>> {
  const vazio = new Set<string>();
  if (!excluir) return vazio;
  const partes: string[] = [];
  if (excluir.marcas?.length) partes.push(`marca_id.in.(${excluir.marcas.join(",")})`);
  if (excluir.unidades?.length) partes.push(`unidade_id.in.(${excluir.unidades.join(",")})`);
  if (excluir.turmas?.length) partes.push(`turma_id.in.(${excluir.turmas.join(",")})`);
  if (!partes.length) return vazio;
  const admin = createAdminClient();
  const { data: aplicacoes, error } = await admin
    .from("apostila_aplicacao")
    .select("geracao_id")
    .or(partes.join(","));
  if (error) throw new Error(error.message);
  const gids = [...new Set((aplicacoes ?? []).map((a) => a.geracao_id))];
  if (!gids.length) return vazio;
  const usadas = new Set<string>();
  const PAGINA = 1000;
  for (let de = 0; ; de += PAGINA) {
    const { data, error: e2 } = await admin
      .from("apostila_questao")
      .select("questao_id")
      .in("geracao_id", gids)
      .range(de, de + PAGINA - 1);
    if (e2) throw new Error(e2.message);
    for (const r of data ?? []) usadas.add(r.questao_id);
    if (!data || data.length < PAGINA) break;
  }
  return usadas;
}

export const NIVEIS_DIFICULDADE = [
  "elementar",
  "facil",
  "medio",
  "dificil",
  "muito_dificil",
] as const;
export type NivelDificuldade = (typeof NIVEIS_DIFICULDADE)[number];

export type ContagemSecao = {
  secao: string;
  porDificuldade: Record<NivelDificuldade | "sem", number>;
  total: number;
};

/**
 * Conta o acervo PUBLICADO disponível para cada seção da receita (contadores ao
 * vivo do construtor), nos 5 níveis de dificuldade + "sem" (não classificada).
 * A dobra elementar->fácil / muito_difícil->difícil (quando o mix não cita o
 * nível) é responsabilidade do CLIENTE, espelhando a semântica da skill.
 * Uma query paginada; filtro de série aplicado em memória (pares olimpiada/nivel).
 */
export async function contarAcervoCore(config: ReceitaConfig): Promise<ContagemSecao[]> {
  const admin = createAdminClient();
  type Linha = {
    id: string;
    olimpiada: string;
    nivel: string | null;
    topico: string | null;
    subtopico: string | null;
    dificuldade: string | null;
  };
  const linhas: Linha[] = [];
  const PAGINA = 1000;
  for (let de = 0; ; de += PAGINA) {
    let query = admin
      .from("questao")
      .select("id, olimpiada, nivel, topico, subtopico, dificuldade")
      .eq("status_cadastro", "publicado")
      .eq("ativo", true)
      .range(de, de + PAGINA - 1);
    if (config.publico) query = query.eq("publico_alvo", config.publico);
    if (config.origens?.length) query = query.in("olimpiada", config.origens);
    if (config.niveis?.length) query = query.in("nivel", config.niveis);
    if (config.anos?.min) query = query.gte("ano", config.anos.min);
    if (config.anos?.max) query = query.lte("ano", config.anos.max);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    linhas.push(...((data ?? []) as Linha[]));
    if (!data || data.length < PAGINA) break;
  }

  let filtradas = linhas;
  if (config.series?.length) {
    const pares = new Set(paresDasSeries(config.series).map(([o, n]) => `${o}|${n}`));
    filtradas = linhas.filter((q) => pares.has(`${q.olimpiada}|${q.nivel}`));
  }
  // Fase 2: desconta o que os alvos de excluir_aplicadas já receberam — o contador
  // mostra o acervo REALMENTE disponível para esta receita.
  const usadas = await questoesJaAplicadas(config.excluir_aplicadas);
  if (usadas.size) {
    filtradas = filtradas.filter((q) => !usadas.has(q.id));
  }

  const nivelDe = (d: string | null): NivelDificuldade | "sem" =>
    d && (NIVEIS_DIFICULDADE as readonly string[]).includes(d) ? (d as NivelDificuldade) : "sem";

  const secoes = config.secoes?.length
    ? config.secoes.map((s) => ({
        secao: s.nome || s.topico,
        filtro: (q: Linha) =>
          q.topico === s.topico &&
          (!s.subtopicos?.length || (!!q.subtopico && s.subtopicos.includes(q.subtopico))),
      }))
    : [{ secao: "(sem seções — apostila inteira)", filtro: (_q: Linha) => true }];

  return secoes.map(({ secao, filtro }) => {
    const porDificuldade: Record<NivelDificuldade | "sem", number> = {
      elementar: 0,
      facil: 0,
      medio: 0,
      dificil: 0,
      muito_dificil: 0,
      sem: 0,
    };
    let total = 0;
    for (const q of filtradas) {
      if (!filtro(q)) continue;
      porDificuldade[nivelDe(q.dificuldade)] += 1;
      total += 1;
    }
    return { secao, porDificuldade, total };
  });
}
