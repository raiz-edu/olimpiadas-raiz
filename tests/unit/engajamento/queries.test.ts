import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarDadosEngajamento } from "@/lib/engajamento/queries";
import { AGORA_ENGAJAMENTO, alunoBase, respostaBase } from "@/tests/fixtures/engajamento";

const mocks = vi.hoisted(() => ({ sessao: vi.fn(), permitido: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession: mocks.sessao }));
vi.mock("@/lib/auth/roles", () => ({ can: mocks.permitido }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));

type Row = Record<string, unknown>;
let tabelas: Record<string, Row[]>;
let falha: string | null;
let from: ReturnType<typeof vi.fn>;
let leituras: { tabela: string; campo: string; ids: unknown[] }[];
let selecoes: { tabela: string; campos: string }[];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessao.mockResolvedValue({ user: { role: "professor" } });
  mocks.permitido.mockReturnValue(true);
  falha = null;
  leituras = [];
  selecoes = [];
  tabelas = {
    aluno: [
      { ...alunoBase("confirmado"), ativo: true },
      { ...alunoBase("legado", { tipo_usuario: null }), ativo: true },
      { ...alunoBase("pendente", { tipo_usuario: "pendente" }), ativo: true },
      { ...alunoBase("prof", { tipo_usuario: "professor" }), ativo: true },
      { ...alunoBase("inativo", { tipo_usuario: null }), ativo: false },
    ],
    resposta_aluno: [
      { ...respostaBase("resposta-confirmada", "confirmado") },
      { ...respostaBase("resposta-legado", "legado") },
    ],
  };
  from = vi.fn((tabela: string) => {
    const filtros: ((row: Row) => boolean)[] = [];
    let inicio = 0;
    let final = 999;
    const q = {
      select: (campos: string) => {
        selecoes.push({ tabela, campos });
        return q;
      },
      eq: (campo: string, valor: unknown) => {
        filtros.push((r) => r[campo] === valor);
        return q;
      },
      or: (expressoes: string) => {
        const opcoes = expressoes.split(",").map((expressao) => expressao.split("."));
        filtros.push((r) =>
          opcoes.some(([campo, operador, valor]) =>
            operador === "is" && valor === "null" ? r[campo!] == null : r[campo!] === valor,
          ),
        );
        return q;
      },
      in: (campo: string, ids: unknown[]) => {
        leituras.push({ tabela, campo, ids });
        filtros.push((r) => ids.includes(r[campo]));
        return q;
      },
      lte: (campo: string, valor: string) => {
        filtros.push((r) => String(r[campo]) <= valor);
        return q;
      },
      order: () => q,
      range: (primeiro: number, ultimo: number) => {
        inicio = primeiro;
        final = ultimo;
        return q;
      },
      abortSignal: () => q,
      overrideTypes: () => q,
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data: (tabelas[tabela] ?? [])
            .filter((r) => filtros.every((f) => f(r)))
            .slice(inicio, final + 1),
          error: falha === tabela ? { message: "falha de consulta" } : null,
        }).then(resolve),
    };
    return q;
  });
  mocks.admin.mockReturnValue({ from });
});

describe("consultas dos grupos de perfil", () => {
  it("retorna pendentes para acompanhamento, consultando estudo só de alunos confirmados", async () => {
    const dados = await carregarDadosEngajamento(AGORA_ENGAJAMENTO);
    expect(dados.alunos.map((a) => a.id)).toEqual(["confirmado", "legado", "pendente"]);
    expect(dados.respostas.map((r) => r.id)).toEqual(["resposta-confirmada"]);
    expect(selecoes.find((s) => s.tabela === "resposta_aluno")!.campos).toContain(
      "olimpiada, nivel, fase",
    );
    expect(leituras.map((leitura) => leitura.ids)).toEqual([
      ["confirmado"],
      ["confirmado"],
      ["confirmado"],
    ]);
  });
  it("com apenas perfis não confirmados, não consulta evidências de estudo", async () => {
    tabelas.aluno = tabelas.aluno!.filter((a) => a.id !== "confirmado");
    const dados = await carregarDadosEngajamento(AGORA_ENGAJAMENTO);
    expect(dados.alunos).toHaveLength(2);
    expect(dados.respostas).toHaveLength(0);
    expect(leituras).toHaveLength(0);
    expect(from.mock.calls.map(([tabela]) => tabela)).not.toContain("resposta_aluno");
  });
  it("preserva a autorização antes de consultar metadados de pendentes", async () => {
    mocks.permitido.mockReturnValue(false);
    await expect(carregarDadosEngajamento(AGORA_ENGAJAMENTO)).rejects.toThrow("Não autorizado");
    expect(from).not.toHaveBeenCalled();
  });
  it("propaga falha de metadados e não a apresenta como lista vazia", async () => {
    falha = "aluno";
    await expect(carregarDadosEngajamento(AGORA_ENGAJAMENTO)).rejects.toThrow();
  });
});
