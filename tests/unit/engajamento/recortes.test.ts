import { describe, expect, it } from "vitest";
import {
  AGORA_ENGAJAMENTO,
  alunoBase,
  dadosBase,
  respostaBase,
} from "@/tests/fixtures/engajamento";
import {
  criarJanelaEstudo,
  janelaAnteriorEstudo,
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
  variacaoAcerto,
} from "@/lib/engajamento/metricas";
import {
  catalogoRecortes,
  nomeOlimpiada,
  recorteIdentificado,
  respostaNoRecorte,
} from "@/lib/engajamento/recortes";

const recorte = { olimpiada: "obmep", nivel: "nivel_2", fase: "1" };
const q = {
  tipo: "multipla_escolha",
  topico: "Geometria",
  assunto: null,
  olimpiada: "obmep",
  nivel: "nivel_2",
  fase: 1,
};

describe("recortes olímpicos do desempenho", () => {
  it("filtra evidências, mantendo alunos sem respostas e sem atribuir aulas genéricas", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("a"), alunoBase("b"), alunoBase("c")];
    dados.respostas = [
      respostaBase("certa", "a", { questao: q }),
      respostaBase("outro-nivel", "a", { questao: { ...q, nivel: "nivel_3" }, correta: false }),
      respostaBase("outra-fase", "a", { questao: { ...q, fase: 2 }, correta: false }),
      respostaBase("outra-origem", "b", { questao: { ...q, olimpiada: "canguru", nivel: "C" } }),
    ];
    dados.progressos = [
      {
        aluno_id: "c",
        aula_id: "geral",
        assistido: true,
        progresso_segundos: 60,
        updated_at: "2026-10-16T11:00:00Z",
      },
    ];
    const alunos = montarAlunosEngajamento(dados, criarJanelaEstudo(7, AGORA_ENGAJAMENTO), recorte);
    expect(alunos).toHaveLength(3);
    expect(alunos[0]).toMatchObject({ tentativas: 1, desempenho: { corrigidas: 1, acertos: 1 } });
    expect(alunos[1]).toMatchObject({
      tentativas: 0,
      ultimaAtividade: null,
      situacao: "sem_estudo",
    });
    expect(alunos[2]).toMatchObject({
      aulasAssistidas: 0,
      estudouPeriodo: false,
      situacao: "sem_estudo",
    });
    expect(
      montarAlunosEngajamento(dados, criarJanelaEstudo(7, AGORA_ENGAJAMENTO))[2]!.aulasAssistidas,
    ).toBe(1);
  });
  it("não converte metadados ausentes em um nível conhecido", () => {
    const semNivel = respostaBase("sem", "a", { questao: { ...q, nivel: null, fase: null } });
    expect(respostaNoRecorte(semNivel, recorte)).toBe(false);
    expect(respostaNoRecorte(semNivel, { nivel: "sem-nivel", fase: "sem-fase" })).toBe(true);
    expect(respostaNoRecorte({ ...semNivel, questao: null }, recorte)).toBe(false);
  });
  it("reutiliza fases únicas e modalidades, preservando valores observados adicionais", () => {
    const dados = dadosBase();
    dados.respostas = [
      respostaBase("nova", "a", {
        questao: { ...q, olimpiada: "nova", nivel: "categoria-x", fase: 3 },
      }),
    ];
    const catalogo = catalogoRecortes(dados);
    expect(catalogo.find((o) => o.valor === "canguru")!.fases).toEqual([
      { valor: "1", nome: "Fase Única" },
    ]);
    expect(catalogo.find((o) => o.valor === "mandacaru")!.fases.map((f) => f.nome)).toEqual([
      "Online",
      "Presencial",
    ]);
    expect(
      recorteIdentificado(catalogo, { olimpiada: "nova", nivel: "categoria-x", fase: "3" }),
    ).toBe(true);
    expect(
      recorteIdentificado(catalogo, { olimpiada: "canguru", nivel: "nivel_2", fase: "2" }),
    ).toBe(false);
    expect(nomeOlimpiada("__proto__")).toBe("__proto__");
    dados.respostas.push(
      respostaBase("prototipo", "a", { questao: { ...q, olimpiada: "__proto__" } }),
    );
    expect(catalogoRecortes(dados).find((o) => o.valor === "__proto__")!.fases).toEqual([
      { valor: "1", nome: "1ª Fase" },
    ]);
  });
  it("normaliza parâmetros repetidos e excessivos sem construir recortes implícitos", () => {
    expect(
      lerFiltrosEngajamento({ olimpiada: ["obmep"], nivel: "x".repeat(300), fase: " 1 " }),
    ).toMatchObject({ olimpiada: "", nivel: "x".repeat(120), fase: "1" });
  });
});

describe("comparação de períodos registrados", () => {
  it("separa os períodos no limite de meia-noite de São Paulo", () => {
    const atual = criarJanelaEstudo(7, AGORA_ENGAJAMENTO);
    const anterior = janelaAnteriorEstudo(atual);
    expect(anterior.inicio).toBe("2026-10-03T00:00:00-03:00");
    expect(Date.parse(anterior.fim)).toBe(Date.parse(atual.inicio) - 1);
    const dados = dadosBase();
    dados.alunos = [alunoBase("a")];
    dados.respostas = [
      respostaBase("anterior", "a", { questao: q, respondido_em: anterior.fim }),
      respostaBase("atual", "a", { questao: q, respondido_em: atual.inicio }),
      respostaBase("futuro", "a", { questao: q, respondido_em: "2030-01-01T00:00:00Z" }),
    ];
    expect(montarAlunosEngajamento(dados, atual, recorte)[0]!.tentativas).toBe(1);
    expect(montarAlunosEngajamento(dados, anterior, recorte)[0]!.tentativas).toBe(1);
  });
  it("exibe variação apenas com base mínima nos dois períodos", () => {
    const atual = { corrigidas: 5, acertos: 3, pendentes: 0 };
    const anterior = { corrigidas: 5, acertos: 1, pendentes: 2 };
    expect(variacaoAcerto(atual, anterior)).toBe(40);
    expect(variacaoAcerto(atual, { ...anterior, corrigidas: 4 })).toBeNull();
    expect(variacaoAcerto({ ...atual, corrigidas: 0 }, anterior)).toBeNull();
  });
});
