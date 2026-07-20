// Fonte única de verdade para labels e níveis das olimpíadas do banco de questões.
// Valores do enum Postgres `olimpiada_questao`: obmep_mirim | obmep | canguru.
// A coluna `questao.nivel` é text livre — os arrays abaixo documentam os valores
// canônicos usados por cada origem.

export const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
  canguru: "Canguru",
};

export const NIVEL_LABEL: Record<string, string> = {
  // OBMEP / OBMEP Mirim
  nivel_1: "Nível 1",
  nivel_2: "Nível 2",
  nivel_3: "Nível 3",
  mirim: "Mirim",
  // Canguru — fase única, nível = categoria por série
  P: "P (3º-4º ano)",
  E: "E (5º-6º ano)",
  B: "B (7º-8º ano)",
  C: "C (9º ano)",
  J: "J (1ª-2ª série EM)",
  S: "S (3ª série EM)",
};

export const NIVEIS_POR_OLIMPIADA: Record<string, string[]> = {
  obmep: ["nivel_1", "nivel_2", "nivel_3"],
  obmep_mirim: ["mirim"],
  canguru: ["P", "E", "B", "C", "J", "S"],
};

/**
 * Fases oferecidas por olimpíada nos filtros. O Canguru tem FASE ÚNICA
 * (armazenada como fase=1 no banco), então rotula como "Fase Única" em vez de
 * "1ª Fase". OBMEP tem 1ª e 2ª fases.
 */
export const FASES_POR_OLIMPIADA: Record<string, { value: string; label: string }[]> = {
  obmep: [
    { value: "1", label: "1ª Fase" },
    { value: "2", label: "2ª Fase" },
  ],
  obmep_mirim: [
    { value: "1", label: "1ª Fase" },
    { value: "2", label: "2ª Fase" },
  ],
  canguru: [{ value: "1", label: "Fase Única" }],
};

/** Fases quando a origem não está selecionada (filtro "Todas as origens"). */
export const FASES_TODAS: { value: string; label: string }[] = [
  { value: "1", label: "1ª Fase" },
  { value: "2", label: "2ª Fase" },
];

/**
 * Rótulo da fase de UMA questão, ciente da olimpíada: "Fase Única" para o
 * Canguru, "Nª Fase" para as demais. Retorna "" quando fase é nula.
 */
export function faseLabel(
  olimpiada: string | null | undefined,
  fase: number | string | null | undefined,
): string {
  if (fase == null || fase === "") return "";
  if (olimpiada === "canguru") return "Fase Única";
  return `${fase}ª Fase`;
}

/** Todos os níveis conhecidos, na ordem de exibição dos filtros. */
export const NIVEIS_TODOS: string[] = [
  "nivel_1",
  "nivel_2",
  "nivel_3",
  "mirim",
  "P",
  "E",
  "B",
  "C",
  "J",
  "S",
];
