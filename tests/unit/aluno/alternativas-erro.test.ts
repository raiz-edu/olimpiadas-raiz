/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regressão da migração de projeto Supabase (2026-08-28): o select das
 * alternativas falhava (coluna imagem_largura inexistente no projeto novo) e a
 * action devolvia [] em silêncio — a tela ficava em "Carregando alternativas…"
 * sem nenhuma pista no log. SPEC: docs/specs/migracao-supabase-raiz-2026-08-28.md (CA3).
 */

const mocks = vi.hoisted(() => ({
  getStudentSession: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/student-session", () => ({
  getStudentSession: mocks.getStudentSession,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/ai/avaliador", () => ({
  avaliarRespostaAberta: vi.fn(),
  avaliarRespostaAbertaComImagem: vi.fn(),
  transcreverFotoAluno: vi.fn(),
}));

type Resultado = { data: unknown; error: { message: string } | null };

/** Cliente admin falso: `questao` resolve em maybeSingle(), `alternativa` em order(). */
function makeAdmin(questao: Resultado, alternativas: Resultado) {
  const chamadas: string[] = [];
  const query = (tabela: string): any => {
    const q: any = {};
    for (const m of ["select", "eq", "in", "not"]) q[m] = vi.fn(() => q);
    q.maybeSingle = vi.fn(async () =>
      tabela === "questao" ? questao : { data: null, error: null },
    );
    q.order = vi.fn(async () =>
      tabela === "alternativa" ? alternativas : { data: null, error: null },
    );
    return q;
  };
  return {
    chamadas,
    client: {
      from: vi.fn((tabela: string) => {
        chamadas.push(tabela);
        return query(tabela);
      }),
    },
  };
}

const ALTERNATIVAS = [
  { id: "alt-a", letra: "A", texto: "2", imagem_url: null, imagem_largura: null },
  { id: "alt-b", letra: "B", texto: "3", imagem_url: null, imagem_largura: "media" },
];

describe("getAlternativasQuestao", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getStudentSession.mockResolvedValue({ aluno: { id: "aluno-1" } });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("sem sessão de aluno devolve [] e não consulta o banco", async () => {
    mocks.getStudentSession.mockResolvedValue(null);
    const admin = makeAdmin(
      { data: { id: "q-1" }, error: null },
      { data: ALTERNATIVAS, error: null },
    );
    mocks.createAdminClient.mockReturnValue(admin.client);

    const { getAlternativasQuestao } = await import("@/app/aluno/(area)/treino/actions");
    const resultado = await getAlternativasQuestao("q-1");

    expect(resultado).toEqual([]);
    expect(admin.chamadas).toEqual([]);
  });

  it("questão não publicada devolve [] sem consultar alternativas", async () => {
    const admin = makeAdmin({ data: null, error: null }, { data: ALTERNATIVAS, error: null });
    mocks.createAdminClient.mockReturnValue(admin.client);

    const { getAlternativasQuestao } = await import("@/app/aluno/(area)/treino/actions");
    const resultado = await getAlternativasQuestao("q-1");

    expect(resultado).toEqual([]);
    expect(admin.chamadas).toEqual(["questao"]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("devolve as alternativas do banco quando a consulta funciona", async () => {
    const admin = makeAdmin(
      { data: { id: "q-1" }, error: null },
      { data: ALTERNATIVAS, error: null },
    );
    mocks.createAdminClient.mockReturnValue(admin.client);

    const { getAlternativasQuestao } = await import("@/app/aluno/(area)/treino/actions");
    const resultado = await getAlternativasQuestao("q-1");

    expect(resultado).toEqual(ALTERNATIVAS);
    expect(admin.chamadas).toEqual(["questao", "alternativa"]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("erro do banco vira [] MAS registra o id da questão e a mensagem no log", async () => {
    const admin = makeAdmin(
      { data: { id: "q-1" }, error: null },
      { data: null, error: { message: "column alternativa.imagem_largura does not exist" } },
    );
    mocks.createAdminClient.mockReturnValue(admin.client);

    const { getAlternativasQuestao } = await import("@/app/aluno/(area)/treino/actions");
    const resultado = await getAlternativasQuestao("q-1");

    expect(resultado).toEqual([]);
    expect(consoleError).toHaveBeenCalledTimes(1);
    const linha = consoleError.mock.calls[0]!.map(String).join(" ");
    expect(linha).toContain("q-1");
    expect(linha).toContain("column alternativa.imagem_largura does not exist");
  });
});
