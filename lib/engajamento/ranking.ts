import {
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
  diaEmSaoPaulo,
  type DadosEngajamento,
  type FiltrosEngajamento,
  type JanelaEstudo,
} from "./metricas";
import {
  catalogoRecortes,
  recorteIdentificado,
  respostaCorrigida,
  respostaNoRecorte,
} from "./recortes";

export type FiltrosRanking = Pick<
  FiltrosEngajamento,
  "marca" | "unidade" | "busca" | "periodo" | "olimpiada" | "nivel" | "fase" | "pagina"
>;
export type AlunoRanking = {
  id: string;
  nome: string;
  unidadeId: string | null;
  unidade: string;
  serie: string | null;
  posicao: number | null;
  acertadas: number;
  respondidas: number;
  corrigidas: number;
  pendentes: number;
  diasPratica: number;
};
export function lerFiltrosRanking(
  params: Record<string, string | string[] | undefined>,
): FiltrosRanking {
  const { marca, unidade, busca, periodo, olimpiada, nivel, fase, pagina } =
    lerFiltrosEngajamento(params);
  return { marca, unidade, busca, periodo, olimpiada, nivel, fase, pagina };
}
export function urlRanking(filtros: FiltrosRanking, alteracoes: Partial<FiltrosRanking> = {}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries({ ...filtros, ...alteracoes })) {
    if (valor !== "" && !(chave === "pagina" && valor === 1)) params.set(chave, String(valor));
  }
  return `/academico/ranking?${params.toString()}`;
}

/** Classifica a marca inteira; unidade e busca só recortam a exibição depois. */
export function montarRankingPreparacao(
  dados: DadosEngajamento,
  janela: JanelaEstudo,
  filtros: FiltrosRanking,
): AlunoRanking[] {
  if (
    !filtros.marca ||
    filtros.marca === "sem-vinculo" ||
    !recorteIdentificado(catalogoRecortes(dados), filtros)
  )
    return [];
  const bases = montarAlunosEngajamento(dados, janela, filtros).filter(
    (a) => a.marcaId === filtros.marca,
  );
  const alunos = new Map(
    bases.map((a) => [
      a.id,
      {
        id: a.id,
        nome: a.nome,
        unidadeId: a.unidadeId,
        unidade: a.unidade,
        serie: a.serie,
        posicao: null,
        acertadas: 0,
        respondidas: 0,
        corrigidas: 0,
        pendentes: 0,
        diasPratica: 0,
      } as AlunoRanking,
    ]),
  );
  const questoes = new Map<string, Map<string, { corrigida: boolean; correta: boolean }>>();
  const dias = new Map<string, Set<string>>();
  const inicio = Date.parse(janela.inicio),
    fim = Date.parse(janela.fim);
  for (const resposta of dados.respostas) {
    const ms = Date.parse(resposta.respondido_em);
    if (
      !alunos.has(resposta.aluno_id) ||
      !Number.isFinite(ms) ||
      ms < inicio ||
      ms > fim ||
      !respostaNoRecorte(resposta, filtros)
    )
      continue;
    if (resposta.contexto !== null && !["banco", "aula", "simulado"].includes(resposta.contexto))
      continue;
    const doAluno =
      questoes.get(resposta.aluno_id) ??
      new Map<string, { corrigida: boolean; correta: boolean }>();
    const estado = doAluno.get(resposta.questao_id) ?? { corrigida: false, correta: false };
    if (respostaCorrigida(resposta)) {
      estado.corrigida = true;
      estado.correta ||= resposta.correta === true;
    }
    doAluno.set(resposta.questao_id, estado);
    questoes.set(resposta.aluno_id, doAluno);
    const diasDoAluno = dias.get(resposta.aluno_id) ?? new Set<string>();
    diasDoAluno.add(diaEmSaoPaulo(new Date(ms)));
    dias.set(resposta.aluno_id, diasDoAluno);
  }
  for (const aluno of alunos.values()) {
    const estados = [...(questoes.get(aluno.id)?.values() ?? [])];
    aluno.respondidas = estados.length;
    aluno.acertadas = estados.filter((q) => q.correta).length;
    aluno.corrigidas = estados.filter((q) => q.corrigida).length;
    aluno.pendentes = aluno.respondidas - aluno.corrigidas;
    aluno.diasPratica = dias.get(aluno.id)?.size ?? 0;
  }
  const linhas = [...alunos.values()].sort(
    (a, b) =>
      b.acertadas - a.acertadas ||
      a.nome.localeCompare(b.nome, "pt-BR") ||
      a.id.localeCompare(b.id),
  );
  let acertosAnteriores = -1,
    posicao = 0;
  return linhas.map((linha, indice) => {
    if (linha.acertadas > 0) {
      if (linha.acertadas !== acertosAnteriores) posicao = indice + 1;
      linha.posicao = posicao;
      acertosAnteriores = linha.acertadas;
    }
    return linha;
  });
}

export function filtrarRanking(
  linhas: AlunoRanking[],
  filtros: Pick<FiltrosRanking, "unidade" | "busca">,
) {
  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const busca = normalizar(filtros.busca);
  return linhas.filter(
    (a) =>
      (!filtros.unidade || (a.unidadeId ?? "sem-vinculo") === filtros.unidade) &&
      (!busca || normalizar(a.nome).includes(busca)),
  );
}
