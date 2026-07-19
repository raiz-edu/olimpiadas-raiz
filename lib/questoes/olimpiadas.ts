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
