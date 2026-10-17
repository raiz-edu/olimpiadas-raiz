import { describe, expect, it } from "vitest";
import {
  AGORA_ENGAJAMENTO,
  alunoBase,
  dadosBase,
  respostaBase,
} from "@/tests/fixtures/engajamento";
import { criarJanelaEstudo } from "@/lib/engajamento/metricas";
import {
  filtrarRanking,
  lerFiltrosRanking,
  montarRankingPreparacao,
  urlRanking,
} from "@/lib/engajamento/ranking";

const janela = criarJanelaEstudo(30, AGORA_ENGAJAMENTO);
const filtros = lerFiltrosRanking({
  marca: "marca-1",
  olimpiada: "obmep",
  nivel: "nivel_2",
  fase: "1",
});
const questao = {
  tipo: "multipla_escolha",
  topico: "Geometria",
  assunto: null,
  olimpiada: "obmep",
  nivel: "nivel_2",
  fase: 1,
};
function base() {
  const dados = dadosBase();
  dados.unidades.push({ id: "outra-unidade", nome: "Unidade Sul", marca_id: "marca-1" });
  dados.alunos = [
    alunoBase("a", { nome: "Álvaro", turma_id: null, unidade_id: "outra-unidade" }),
    alunoBase("b", { nome: "Beatriz" }),
    alunoBase("c", { nome: "Caio" }),
    alunoBase("d"),
    alunoBase("legado", { tipo_usuario: null }),
    alunoBase("novo", { tipo_usuario: "pendente" }),
    alunoBase("prof", { tipo_usuario: "professor" }),
    alunoBase("colab", { tipo_usuario: "colaborador" }),
    alunoBase("outra", { marca_id: "marca-2", turma_id: "turma-2" }),
  ];
  return dados;
}
const resposta = (id: string, aluno: string, questaoId: string) =>
  respostaBase(id, aluno, { questao_id: questaoId, questao });

describe("ranking de preparação por marca", () => {
  it("compartilha posições em empate e mantém alunos sem acertos sem posição", () => {
    const dados = base();
    dados.respostas = [
      resposta("a1", "a", "q1"),
      resposta("a2", "a", "q2"),
      resposta("b1", "b", "q1"),
      resposta("b2", "b", "q2"),
      resposta("c1", "c", "q1"),
    ];
    const linhas = montarRankingPreparacao(dados, janela, filtros);
    expect(linhas.map((a) => [a.id, a.posicao])).toEqual([
      ["a", 1],
      ["b", 1],
      ["c", 3],
      ["d", null],
    ]);
    expect(linhas[3]).toMatchObject({ respondidas: 0, acertadas: 0, diasPratica: 0 });
  });
  it("conta cada questão uma vez mesmo entre aulas, simulados e repetições", () => {
    const dados = base();
    dados.respostas = [
      resposta("livre", "a", "q1"),
      { ...resposta("aula", "a", "q1"), contexto: "aula", aula_id: "aula-1" },
      { ...resposta("simulado", "a", "q1"), contexto: "simulado", aula_id: "simulado-1" },
      {
        ...resposta("erro-depois", "a", "q1"),
        correta: false,
        respondido_em: "2026-10-16T14:00:00Z",
      },
      { ...resposta("erro", "a", "q2"), correta: false },
    ];
    expect(montarRankingPreparacao(dados, janela, filtros)[0]).toMatchObject({
      acertadas: 1,
      respondidas: 2,
      corrigidas: 2,
      diasPratica: 1,
    });
  });
  it("distingue pendências únicas de correções válidas da mesma questão", () => {
    const dados = base();
    dados.respostas = [
      {
        ...resposta("pendente", "a", "q1"),
        questao: { ...questao, tipo: "aberta" },
        correta: null,
      },
      {
        ...resposta("corrigida", "a", "q1"),
        questao: { ...questao, tipo: "aberta" },
        feedback_ia: [{ correta: true }],
      },
      { ...resposta("ainda-pendente", "a", "q2"), questao: { ...questao, tipo: "aberta" } },
    ];
    expect(montarRankingPreparacao(dados, janela, filtros)[0]).toMatchObject({
      acertadas: 1,
      respondidas: 2,
      corrigidas: 1,
      pendentes: 1,
    });
  });
  it("exclui outros perfis, marca, níveis, fases, diagnósticos e eventos fora da janela", () => {
    const dados = base();
    dados.respostas = [
      ...["legado", "novo", "prof", "colab", "outra"].map((id) => resposta(id, id, "q1")),
      { ...resposta("nivel", "a", "q1"), questao: { ...questao, nivel: "nivel_3" } },
      { ...resposta("fase", "a", "q2"), questao: { ...questao, fase: 2 } },
      {
        ...resposta("origem", "a", "q3"),
        questao: { ...questao, olimpiada: "canguru", nivel: "C" },
      },
      { ...resposta("diagnostico", "a", "q4"), contexto: "diagnostico" },
      { ...resposta("futuro", "a", "q5"), respondido_em: "2030-01-01T00:00:00Z" },
      { ...resposta("antiga", "a", "q6"), respondido_em: "2026-08-01T00:00:00Z" },
      { ...resposta("removida", "a", "q7"), questao: null },
    ];
    const linhas = montarRankingPreparacao(dados, janela, filtros);
    expect(linhas).toHaveLength(4);
    expect(linhas.every((a) => a.posicao === null && a.acertadas === 0)).toBe(true);
  });
  it("preserva posição na marca ao filtrar unidade e nome sem acento", () => {
    const dados = base();
    dados.respostas = [
      resposta("a1", "a", "q1"),
      resposta("b1", "b", "q1"),
      resposta("b2", "b", "q2"),
    ];
    const linhas = montarRankingPreparacao(dados, janela, filtros);
    const filtradas = filtrarRanking(linhas, { unidade: "outra-unidade", busca: "alvaro" });
    expect(filtradas.map((a) => [a.id, a.posicao])).toEqual([["a", 2]]);
  });
  it("não classifica seleções incompletas, desconhecidas ou incompatíveis", () => {
    const dados = base();
    for (const alteracao of [
      { marca: "" },
      { nivel: "" },
      { fase: "sem-fase" },
      { olimpiada: "canguru" },
      { olimpiada: "__proto__" },
    ]) {
      expect(montarRankingPreparacao(dados, janela, { ...filtros, ...alteracao })).toEqual([]);
    }
  });
  it("preserva o recorte e codifica a busca nos links de paginação", () => {
    const url = new URL(
      urlRanking({ ...filtros, busca: "João & Maria" }, { pagina: 2 }),
      "https://exemplo.test",
    );
    expect(url.pathname).toBe("/academico/ranking");
    expect(url.searchParams.get("pagina")).toBe("2");
    expect(url.searchParams.get("busca")).toBe("João & Maria");
    expect(url.searchParams.get("nivel")).toBe("nivel_2");
    expect(
      lerFiltrosRanking({ pagina: "-1", periodo: "invalido", marca: ["marca-1"] }),
    ).toMatchObject({ pagina: 1, periodo: 30, marca: "" });
  });
});
