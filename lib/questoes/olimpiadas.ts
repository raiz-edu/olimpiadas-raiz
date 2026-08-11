// Fonte única de verdade para labels e níveis das olimpíadas do banco de questões.
// A coluna `questao.olimpiada` é text livre desde a migration 017 — origens em uso:
// obmep_mirim | obmep | canguru | jacob_palis | omerj | mandacaru.
// A coluna `questao.nivel` é text livre — os arrays abaixo documentam os valores
// canônicos usados por cada origem.

export const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
  canguru: "Canguru",
  jacob_palis: "Jacob Palis",
  omerj: "OMERJ",
  mandacaru: "Mandacaru",
};

export const NIVEL_LABEL: Record<string, string> = {
  // OBMEP / OBMEP Mirim
  nivel_1: "Nível 1",
  nivel_2: "Nível 2",
  nivel_3: "Nível 3",
  mirim: "Mirim",
  // OMERJ — fase única, prova discursiva; Jr = 5º ano, 4 = 3ª série EM
  junior: "Júnior (5º ano)",
  nivel_4: "Nível 4 (3ª série EM)",
  // Canguru — fase única, nível = categoria por série
  P: "P (3º-4º ano)",
  E: "E (5º-6º ano)",
  B: "B (7º-8º ano)",
  C: "C (9º ano)",
  J: "J (1ª-2ª série EM)",
  S: "S (3ª série EM)",
  // Mandacaru — nível = categoria por série, nomeada pela cultura nordestina
  cajuina: "Cajuína (4º-5º ano)",
  luiz_gonzaga: "Luiz Gonzaga (6º-7º ano)",
  zumbi: "Zumbi dos Palmares (8º-9º ano)",
  lampiao: "Lampião (EM)",
};

export const NIVEIS_POR_OLIMPIADA: Record<string, string[]> = {
  obmep: ["nivel_1", "nivel_2", "nivel_3"],
  obmep_mirim: ["mirim"],
  canguru: ["P", "E", "B", "C", "J", "S"],
  jacob_palis: ["nivel_1", "nivel_2", "nivel_3"],
  omerj: ["junior", "nivel_1", "nivel_2", "nivel_3", "nivel_4"],
  mandacaru: ["cajuina", "luiz_gonzaga", "zumbi", "lampiao"],
};

/**
 * Olimpíadas de FASE ÚNICA — a fase é armazenada como fase=1 no banco, mas
 * rotulada "Fase Única" em vez de "1ª Fase" (não existe uma 2ª).
 */
export const OLIMPIADAS_FASE_UNICA: readonly string[] = ["canguru", "jacob_palis", "omerj"];

/**
 * Fases oferecidas por olimpíada nos filtros. OBMEP tem 1ª e 2ª fases;
 * Canguru, Jacob Palis e OMERJ têm fase única.
 *
 * Mandacaru é o caso especial: Online e Presencial não são fases sequenciais, e sim
 * MODALIDADES excludentes (o regulamento proíbe fazer as duas) com provas diferentes.
 * Como `questao.fase` é int, a modalidade ocupa essa coluna — 1=Online, 2=Presencial —
 * e o rótulo aqui é o que aparece na interface. Anos em que saiu uma prova só
 * (2022, e 2026 com Online e Presencial idênticas) entram como fase=1.
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
  jacob_palis: [{ value: "1", label: "Fase Única" }],
  omerj: [{ value: "1", label: "Fase Única" }],
  mandacaru: [
    { value: "1", label: "Online" },
    { value: "2", label: "Presencial" },
  ],
};

/** Fases quando a origem não está selecionada (filtro "Todas as origens"). */
export const FASES_TODAS: { value: string; label: string }[] = [
  { value: "1", label: "1ª Fase" },
  { value: "2", label: "2ª Fase" },
];

/**
 * Rótulo da fase de UMA questão, ciente da olimpíada. Consulta primeiro o rótulo
 * que a própria origem declara em FASES_POR_OLIMPIADA — assim "Fase Única"
 * (Canguru, Jacob Palis, OMERJ) e "Online"/"Presencial" (Mandacaru) saem certos
 * sem cada origem precisar de um caso especial aqui. Cai em "Nª Fase" para as
 * origens que não declaram rótulo. Retorna "" quando fase é nula.
 */
export function faseLabel(
  olimpiada: string | null | undefined,
  fase: number | string | null | undefined,
): string {
  if (fase == null || fase === "") return "";
  const declarado = olimpiada
    ? FASES_POR_OLIMPIADA[olimpiada]?.find((f) => f.value === String(fase))
    : undefined;
  if (declarado) return declarado.label;
  if (olimpiada && OLIMPIADAS_FASE_UNICA.includes(olimpiada)) return "Fase Única";
  return `${fase}ª Fase`;
}

/** Todos os níveis conhecidos, na ordem de exibição dos filtros. */
export const NIVEIS_TODOS: string[] = [
  "nivel_1",
  "nivel_2",
  "nivel_3",
  "nivel_4",
  "mirim",
  "junior",
  "P",
  "E",
  "B",
  "C",
  "J",
  "S",
  "cajuina",
  "luiz_gonzaga",
  "zumbi",
  "lampiao",
];
