import {
  FASES_POR_OLIMPIADA,
  NIVEL_LABEL,
  NIVEIS_POR_OLIMPIADA,
  OLIMPIADA_LABEL,
} from "@/lib/questoes/olimpiadas";
import type { DadosEngajamento, RespostaEstudo } from "./metricas";

export const SEM_NIVEL = "sem-nivel";
export const SEM_FASE = "sem-fase";
export type RecorteQuestoes = { olimpiada?: string; nivel?: string; fase?: string };
export type OpcaoRecorte = { valor: string; nome: string };
export type OrigemRecorte = {
  valor: string;
  nome: string;
  niveis: OpcaoRecorte[];
  fases: OpcaoRecorte[];
};

function rotulo(mapa: Record<string, string>, valor: string) {
  return Object.hasOwn(mapa, valor) ? mapa[valor]! : valor;
}
export const nomeOlimpiada = (valor: string) => rotulo(OLIMPIADA_LABEL, valor);
export const nomeNivel = (valor: string) => rotulo(NIVEL_LABEL, valor);
export function faseDaQuestao(fase: number | null | undefined) {
  return Number.isSafeInteger(fase) && fase! > 0 ? String(fase) : SEM_FASE;
}
export function temRecorteQuestoes(recorte: RecorteQuestoes) {
  return Boolean(recorte.olimpiada || recorte.nivel || recorte.fase);
}
export function respostaNoRecorte(resposta: RespostaEstudo, recorte: RecorteQuestoes) {
  if (!temRecorteQuestoes(recorte)) return true;
  const q = resposta.questao;
  return Boolean(
    q &&
    (!recorte.olimpiada || q.olimpiada.trim() === recorte.olimpiada) &&
    (!recorte.nivel || (q.nivel?.trim() || SEM_NIVEL) === recorte.nivel) &&
    (!recorte.fase || faseDaQuestao(q.fase) === recorte.fase),
  );
}
export function respostaCorrigida(resposta: RespostaEstudo) {
  return Boolean(
    resposta.questao &&
    typeof resposta.correta === "boolean" &&
    (resposta.questao.tipo !== "aberta" || resposta.feedback_ia),
  );
}

/** Catálogo conhecido mais valores observados; sem inferir metadados ausentes. */
export function catalogoRecortes(dados: Pick<DadosEngajamento, "respostas">): OrigemRecorte[] {
  const origens = new Map<string, { niveis: Set<string>; fases: Set<string> }>();
  for (const origem of Object.keys(OLIMPIADA_LABEL)) {
    origens.set(origem, {
      niveis: new Set(NIVEIS_POR_OLIMPIADA[origem] ?? []),
      fases: new Set((FASES_POR_OLIMPIADA[origem] ?? []).map((f) => f.value)),
    });
  }
  for (const { questao } of dados.respostas) {
    const origem = questao?.olimpiada.trim();
    if (!origem) continue;
    const catalogo = origens.get(origem) ?? { niveis: new Set<string>(), fases: new Set<string>() };
    catalogo.niveis.add(questao!.nivel?.trim() || SEM_NIVEL);
    catalogo.fases.add(faseDaQuestao(questao!.fase));
    origens.set(origem, catalogo);
  }
  return [...origens]
    .map(([valor, { niveis, fases }]) => ({
      valor,
      nome: nomeOlimpiada(valor),
      niveis: [...niveis].map((nivel) => ({
        valor: nivel,
        nome: nivel === SEM_NIVEL ? "Nível não informado" : nomeNivel(nivel),
      })),
      fases: [...fases].map((fase) => ({
        valor: fase,
        nome:
          fase === SEM_FASE
            ? "Fase não informada"
            : ((Object.hasOwn(FASES_POR_OLIMPIADA, valor) ? FASES_POR_OLIMPIADA[valor] : [])?.find(
                (f) => f.value === fase,
              )?.label ?? `${fase}ª Fase`),
      })),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function recorteIdentificado(catalogo: OrigemRecorte[], recorte: RecorteQuestoes) {
  const origem = catalogo.find((o) => o.valor === recorte.olimpiada);
  return Boolean(
    origem &&
    recorte.nivel &&
    recorte.nivel !== SEM_NIVEL &&
    recorte.fase &&
    recorte.fase !== SEM_FASE &&
    origem.niveis.some((n) => n.valor === recorte.nivel) &&
    origem.fases.some((f) => f.valor === recorte.fase),
  );
}
