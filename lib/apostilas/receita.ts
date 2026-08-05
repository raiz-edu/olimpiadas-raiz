// Contrato da RECEITA de apostila — o mesmo JSON que a skill gerar-apostila
// (Ferramenta 4) consome. A tela do construtor produz exatamente este formato;
// mudanças aqui exigem mudança correspondente na skill (e vice-versa).

import { TAXONOMIA_QUESTOES } from "@/lib/questoes/taxonomia";

export type MixDificuldade = Partial<
  Record<"elementar" | "facil" | "medio" | "dificil" | "muito_dificil", number>
>;

export type SecaoReceita = {
  topico: string;
  subtopicos?: string[];
  quantidade?: number;
  mix_dificuldade?: MixDificuldade;
  nome?: string;
};

export type EstiloReceita = {
  colunas?: 1 | 2;
  escala_figuras?: number;
  fonte?: string;
  tamanho_fonte?: number;
  espacamento?: number;
};

/** Alvos cuja produção anterior NÃO deve se repetir (Fase 2, issue #141). */
export type ExcluirAplicadas = {
  marcas?: string[];
  unidades?: string[];
  turmas?: string[];
};

export type ReceitaConfig = {
  titulo: string;
  subtitulo?: string;
  marca?: string;
  excluir_aplicadas?: ExcluirAplicadas;
  series?: string[];
  origens?: string[];
  niveis?: string[];
  publico?: "EFAI" | "EFAF" | "EM";
  anos?: { min?: number; max?: number };
  seed?: number;
  mix_dificuldade?: MixDificuldade;
  secoes?: SecaoReceita[];
  estilo?: EstiloReceita;
  sem_solucoes?: boolean;
  compacto?: boolean;
};

// Os 5 níveis do banco, na ordem pedagógica (decisão do Helio 2026-08-04: o mix
// trabalha com os 5, no global e por seção). A skill dobra elementar->fácil e
// muito_dificil->difícil apenas quando o mix NÃO cita esses níveis.
export const DIFICULDADES_MIX = [
  "elementar",
  "facil",
  "medio",
  "dificil",
  "muito_dificil",
] as const;

export const DIFICULDADE_LABEL: Record<string, string> = {
  elementar: "Elementar",
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito difícil",
};

/** Soma dos percentuais de um mix (ignora chaves vazias). */
export function somaMix(mix: MixDificuldade | undefined): number {
  if (!mix) return 0;
  return Object.values(mix).reduce((s, v) => s + (v ?? 0), 0);
}

/**
 * Valida a receita antes de salvar. Retorna a lista de erros (vazia = válida).
 * Regras: título obrigatório; mix (global ou de seção) presente deve somar 100;
 * seção deve ter tópico da taxonomia canônica e subtópicos do próprio tópico;
 * quantidade, quando informada, deve ser > 0; mix de seção exige quantidade.
 */
export function validarReceita(config: ReceitaConfig): string[] {
  const erros: string[] = [];
  if (!config.titulo?.trim()) erros.push("Título é obrigatório.");
  if (config.mix_dificuldade && somaMix(config.mix_dificuldade) !== 100) {
    erros.push("Mix de dificuldade global deve somar 100%.");
  }
  for (const [i, sec] of (config.secoes ?? []).entries()) {
    const rotulo = sec.topico || `seção ${i + 1}`;
    if (!sec.topico || !(sec.topico in TAXONOMIA_QUESTOES)) {
      erros.push(`Seção "${rotulo}": tópico fora da taxonomia canônica.`);
      continue;
    }
    const subsValidos = TAXONOMIA_QUESTOES[sec.topico] ?? [];
    for (const sub of sec.subtopicos ?? []) {
      if (!subsValidos.includes(sub)) {
        erros.push(`Seção "${rotulo}": subtópico "${sub}" não pertence ao tópico.`);
      }
    }
    if (
      sec.quantidade !== undefined &&
      (!Number.isInteger(sec.quantidade) || sec.quantidade <= 0)
    ) {
      erros.push(`Seção "${rotulo}": quantidade deve ser um inteiro maior que zero.`);
    }
    if (sec.mix_dificuldade && somaMix(sec.mix_dificuldade) !== 100) {
      erros.push(`Seção "${rotulo}": mix de dificuldade deve somar 100%.`);
    }
    if (sec.mix_dificuldade && sec.quantidade === undefined) {
      erros.push(`Seção "${rotulo}": mix próprio exige quantidade definida.`);
    }
  }
  const mixGlobalSemQuantidade =
    config.mix_dificuldade &&
    (config.secoes ?? []).some((s) => s.quantidade === undefined) &&
    (config.secoes ?? []).length > 0;
  if (mixGlobalSemQuantidade) {
    erros.push("Com mix global, toda seção precisa de quantidade definida.");
  }
  return erros;
}

export type VersoesGeracao = { professor?: string; aluno?: string };

export type LinhaBalanco = {
  secao: string;
  dificuldade: string;
  pedido: number;
  entregue: number;
  substituidas: number;
  deficit: number;
};
