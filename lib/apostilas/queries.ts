// Leituras do módulo Apostilas (server-only; adminClient — RLS sem policies).

import { createAdminClient } from "@/lib/supabase/admin";
import { paresDasSeries } from "@/lib/questoes/series";
import type { LinhaBalanco, ReceitaConfig, VersoesGeracao } from "@/lib/apostilas/receita";

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

export async function getReceita(
  id: string,
): Promise<(ReceitaRow & { geracoes: GeracaoRow[] }) | null> {
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
  return { ...(receita as ReceitaRow), geracoes: (geracoes ?? []) as GeracaoRow[] };
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
      .select("olimpiada, nivel, topico, subtopico, dificuldade")
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
