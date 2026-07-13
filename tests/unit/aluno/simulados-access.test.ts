import { describe, expect, it } from "vitest";
import {
  escolherProjetoVisivelDoSimulado,
  isSimuladoDisponivelParaAluno,
  type AlunoSimuladoAccessContext,
  type ProjetoAccessRow,
} from "@/lib/aluno/simulado-access";
import { fromSaoPauloDatetimeLocal, toSaoPauloDatetimeLocal } from "@/lib/time/sao-paulo";

const contextoBase: AlunoSimuladoAccessContext = {
  turmaId: "4955b8fd-30b7-4b89-9e3d-07e9a4e2b8d0",
  alunoSerie: null,
  turmaSerie: "9º",
  olimpiadaIdsConfirmadas: new Set(["olimpiada-1"]),
};

const projetoVisivel: ProjetoAccessRow = {
  id: "projeto-1",
  nome: "Preparacao OBMEP",
  olimpiada_sigla: "OBMEP",
  olimpiada_id: "olimpiada-1",
  publicado: true,
  ativo: true,
};

describe("simulado access helpers", () => {
  it("keeps datetime-local roundtrip in America/Sao_Paulo", () => {
    const iso = fromSaoPauloDatetimeLocal("2026-07-13T18:00");

    expect(iso).toBe("2026-07-13T18:00:00-03:00");
    expect(toSaoPauloDatetimeLocal("2026-07-13T21:00:00.000Z")).toBe("2026-07-13T18:00");
  });

  it("allows simulated tests linked to the student's class", () => {
    expect(
      isSimuladoDisponivelParaAluno(
        { turma_ids: ["4955b8fd-30b7-4b89-9e3d-07e9a4e2b8d0"] },
        contextoBase,
        new Map(),
      ),
    ).toBe(true);
  });

  it("rejects simulated tests linked only to another class", () => {
    expect(
      isSimuladoDisponivelParaAluno(
        { turma_ids: ["00000000-0000-0000-0000-000000000000"] },
        contextoBase,
        new Map(),
      ),
    ).toBe(false);
  });

  it("allows simulated tests linked to a visible project", () => {
    const projetos = new Map([[projetoVisivel.id, projetoVisivel]]);
    const simulado = { projeto_ids: [projetoVisivel.id] };

    expect(isSimuladoDisponivelParaAluno(simulado, contextoBase, projetos)).toBe(true);
    expect(escolherProjetoVisivelDoSimulado(simulado, contextoBase, projetos)).toEqual(
      projetoVisivel,
    );
  });

  it("allows simulated tests linked by turma serie or aluno serie", () => {
    expect(
      isSimuladoDisponivelParaAluno({ series_elegiveis: ["9º"] }, contextoBase, new Map()),
    ).toBe(true);

    expect(
      isSimuladoDisponivelParaAluno(
        { series_elegiveis: ["1º EM"] },
        { ...contextoBase, turmaSerie: null, alunoSerie: "1º EM" },
        new Map(),
      ),
    ).toBe(true);
  });
});
