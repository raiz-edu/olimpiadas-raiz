import { describe, expect, it, vi, beforeEach } from "vitest";

// O módulo consulta o banco; o mock devolve convite/marca controlados por teste.
const estado: { convite: unknown; marca: unknown } = { convite: null, marca: null };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (tabela: string) => {
      const encadeia = {
        select: () => encadeia,
        eq: () => encadeia,
        is: () => encadeia,
        order: () => encadeia,
        limit: () => encadeia,
        update: () => encadeia,
        maybeSingle: async () =>
          tabela === "convite" ? { data: estado.convite } : { data: estado.marca },
      };
      return encadeia;
    },
  }),
}));

const { resolverPrimeiroAcesso } = await import("@/lib/auth/primeiro-acesso");

beforeEach(() => {
  estado.convite = null;
  estado.marca = null;
});

describe("resolverPrimeiroAcesso", () => {
  it("convite pendente manda na marca e no papel", async () => {
    estado.convite = { id: "conv-1", role: "professor", marca_id: "marca-qi" };
    const r = await resolverPrimeiroAcesso("lucas.benjamin@matrizeducacao.com.br");
    // e-mail é da Matriz, mas o convite prevê QI — é o caso das 3 divergências do lote
    expect(r).toEqual({ role: "professor", marcaId: "marca-qi", conviteId: "conv-1" });
  });

  it("sem convite, a marca vem do domínio", async () => {
    estado.marca = { id: "marca-global-tree" };
    const r = await resolverPrimeiroAcesso("professor@crecheglobaltree.com.br");
    expect(r).toEqual({
      role: "professor",
      marcaId: "marca-global-tree",
      conviteId: null,
    });
  });

  it("admin continua admin mesmo com convite de professor", async () => {
    estado.convite = { id: "conv-2", role: "professor", marca_id: "marca-x" };
    const r = await resolverPrimeiroAcesso("hugo.carvalho@raizeducacao.com.br");
    expect(r.role).toBe("raiz");
  });

  it("domínio sem marca cadastrada não quebra o login", async () => {
    estado.marca = null;
    const r = await resolverPrimeiroAcesso("pessoa@unificado.com.br");
    expect(r).toEqual({ role: "professor", marcaId: null, conviteId: null });
  });
});
