import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  rpc: vi.fn(),
  admin: vi.fn(),
  pessoas: [] as unknown[],
  chamadas: [] as { fonte: string; inicio: number; fim: number }[],
  filtros: [] as { fonte: string; campo: string; valores: string[] }[],
  erroSegundaPagina: false,
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
import { carregarDadosAcessos } from "@/lib/acessos/queries";

function builder(fonte: string) {
  let inicio = 0;
  let fim = 499;
  return {
    select() {
      return this;
    },
    order() {
      return this;
    },
    in(campo: string, valores: string[]) {
      mocks.filtros.push({ fonte, campo, valores });
      return this;
    },
    range(a: number, b: number) {
      inicio = a;
      fim = b;
      return this;
    },
    abortSignal() {
      mocks.chamadas.push({ fonte, inicio, fim });
      if (fonte === "pessoas" && inicio === 500 && mocks.erroSegundaPagina)
        return Promise.resolve({ data: null, error: { message: "falha" } });
      const dados = fonte === "pessoas" ? mocks.pessoas : [];
      return Promise.resolve({ data: dados.slice(inicio, fim + 1), error: null });
    },
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pessoas = Array.from({ length: 1105 }, (_, i) => ({ pessoa_id: String(i) }));
  mocks.chamadas = [];
  mocks.filtros = [];
  mocks.erroSegundaPagina = false;
  mocks.session.mockResolvedValue({ user: { role: "raiz", marca_ativa_id: null } });
  mocks.rpc.mockImplementation(() => builder("pessoas"));
  mocks.admin.mockReturnValue({ rpc: mocks.rpc, from: builder });
});
describe("consulta completa e autorizada", () => {
  it("pagina mais de mil pessoas com a mesma janela em todas as páginas", async () => {
    const agora = new Date("2026-10-19T15:00:00Z");
    const resultado = await carregarDadosAcessos(null, agora);
    expect(resultado.pessoas).toHaveLength(1105);
    expect(mocks.chamadas.filter((c) => c.fonte === "pessoas")).toEqual([
      { fonte: "pessoas", inicio: 0, fim: 499 },
      { fonte: "pessoas", inicio: 500, fim: 999 },
      { fonte: "pessoas", inicio: 1000, fim: 1499 },
    ]);
    for (const chamada of mocks.rpc.mock.calls)
      expect(chamada).toEqual([
        "gestao_acessos",
        { p_marcas: null, p_desde: null, p_ate: agora.toISOString() },
      ]);
  });
  it("impõe a marca do diretor em pessoas e nas opções de filtros", async () => {
    mocks.session.mockResolvedValue({
      user: { role: "diretor_marca", marca_ativa_id: "marca-do-servidor" },
    });
    await carregarDadosAcessos(null, new Date());
    expect(mocks.rpc.mock.calls[0]?.[1].p_marcas).toEqual(["marca-do-servidor"]);
    expect(mocks.filtros).toContainEqual({
      fonte: "marca",
      campo: "id",
      valores: ["marca-do-servidor"],
    });
    expect(mocks.filtros).toContainEqual({
      fonte: "unidade",
      campo: "marca_id",
      valores: ["marca-do-servidor"],
    });
  });
  it("falha de uma página interrompe a leitura sem retornar totais parciais", async () => {
    mocks.erroSegundaPagina = true;
    await expect(carregarDadosAcessos(null, new Date())).rejects.toThrow(
      "Não foi possível carregar",
    );
  });
  it.each([
    null,
    { user: { role: "professor", marca_ativa_id: "m" } },
    { user: { role: "diretor_marca", marca_ativa_id: null } },
  ])("sem escopo válido não consulta o banco: %j", async (session) => {
    mocks.session.mockResolvedValue(session);
    await expect(carregarDadosAcessos(null, new Date())).rejects.toThrow();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
});
