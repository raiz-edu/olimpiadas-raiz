// Mapeamento canônico SÉRIE -> pares (olimpiada, nivel) do banco de questões.
// Fonte única de verdade (issue #136); a cópia Python da skill gerar-apostila
// espelha este arquivo. Base: OBMEP N1=6º-7º / N2=8º-9º / N3=EM (oficial);
// Canguru P/E/B/C/J/S por série (rótulos em olimpiadas.ts); Mandacaru
// cajuina/luiz_gonzaga/zumbi/lampiao (regulamento art. 5.15); OMERJ junior=5º e
// nivel_4=3ª EM (rótulos do sistema; N1-N3 intermediários são inferência).

export type SerieKey = "4" | "5" | "6" | "7" | "8" | "9" | "1em" | "2em" | "3em";

export type ParOrigemNivel = readonly [olimpiada: string, nivel: string];

export const SERIE_MAP: Record<SerieKey, readonly ParOrigemNivel[]> = {
  "4": [
    ["obmep_mirim", "mirim"],
    ["canguru", "P"],
    ["mandacaru", "cajuina"],
  ],
  "5": [
    ["obmep_mirim", "mirim"],
    ["canguru", "E"],
    ["mandacaru", "cajuina"],
    ["omerj", "junior"],
  ],
  "6": [
    ["obmep", "nivel_1"],
    ["canguru", "E"],
    ["mandacaru", "luiz_gonzaga"],
    ["jacob_palis", "nivel_1"],
    ["omerj", "nivel_1"],
  ],
  "7": [
    ["obmep", "nivel_1"],
    ["canguru", "B"],
    ["mandacaru", "luiz_gonzaga"],
    ["jacob_palis", "nivel_1"],
    ["omerj", "nivel_1"],
  ],
  "8": [
    ["obmep", "nivel_2"],
    ["canguru", "B"],
    ["mandacaru", "zumbi"],
    ["jacob_palis", "nivel_2"],
    ["omerj", "nivel_2"],
  ],
  "9": [
    ["obmep", "nivel_2"],
    ["canguru", "C"],
    ["mandacaru", "zumbi"],
    ["jacob_palis", "nivel_2"],
    ["omerj", "nivel_2"],
  ],
  "1em": [
    ["obmep", "nivel_3"],
    ["canguru", "J"],
    ["mandacaru", "lampiao"],
    ["jacob_palis", "nivel_3"],
    ["omerj", "nivel_3"],
  ],
  "2em": [
    ["obmep", "nivel_3"],
    ["canguru", "J"],
    ["mandacaru", "lampiao"],
    ["jacob_palis", "nivel_3"],
    ["omerj", "nivel_3"],
  ],
  "3em": [
    ["obmep", "nivel_3"],
    ["canguru", "S"],
    ["mandacaru", "lampiao"],
    ["jacob_palis", "nivel_3"],
    ["omerj", "nivel_4"],
  ],
};

export const SERIE_LABEL: Record<SerieKey, string> = {
  "4": "4º ano",
  "5": "5º ano",
  "6": "6º ano",
  "7": "7º ano",
  "8": "8º ano",
  "9": "9º ano",
  "1em": "1ª série EM",
  "2em": "2ª série EM",
  "3em": "3ª série EM",
};

export const SERIES_ORDEM: readonly SerieKey[] = [
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "1em",
  "2em",
  "3em",
];

/**
 * Normaliza texto livre de série para a chave canônica.
 * "8º ano" -> "8"; "2ª série EM" / "2 em" -> "2em".
 * Na Raiz, "série" indica EM (o EF usa "ano").
 */
export function serieKey(txt: string): SerieKey | null {
  const t = txt.toLowerCase();
  const m = t.match(/\d/);
  if (!m) return null;
  const em = /\bem\b|m[eé]dio|s[eé]rie/.test(t);
  const key = em ? `${m[0]}em` : m[0];
  return key in SERIE_MAP ? (key as SerieKey) : null;
}

/** União dos pares (olimpiada, nivel) de várias séries, sem duplicatas. */
export function paresDasSeries(series: readonly string[]): ParOrigemNivel[] {
  const vistos = new Set<string>();
  const out: ParOrigemNivel[] = [];
  for (const s of series) {
    const key = serieKey(s);
    if (!key) continue;
    for (const par of SERIE_MAP[key]) {
      const chave = `${par[0]}|${par[1]}`;
      if (!vistos.has(chave)) {
        vistos.add(chave);
        out.push(par);
      }
    }
  }
  return out;
}
