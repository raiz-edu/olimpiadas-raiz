import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pagina from "@/app/(protected)/academico/desempenho/page";
import { carregarDadosEngajamento } from "@/lib/engajamento/queries";
import { dadosBase } from "@/tests/fixtures/engajamento";

const mocks = vi.hoisted(() => ({
  sessao: vi.fn(),
  permitido: vi.fn(),
  dados: vi.fn(),
  admin: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession: mocks.sessao }));
vi.mock("@/lib/auth/roles", () => ({ can: mocks.permitido }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`redirect:${destino}`);
  },
}));
vi.mock("@/lib/engajamento/queries", () => ({ carregarDadosEngajamento: vi.fn() }));
vi.mock("@/components/engajamento/painel", () => ({
  PainelEngajamento: () => createElement("div", null, "Painel pedagógico"),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessao.mockResolvedValue({ user: { id: "equipe", role: "professor" } });
  mocks.permitido.mockReturnValue(true);
  vi.mocked(carregarDadosEngajamento).mockReset();
});

describe("acesso e indisponibilidade do painel", () => {
  it("não consulta indicadores sem sessão", async () => {
    mocks.sessao.mockResolvedValue(null);
    expect(await Pagina({ searchParams: Promise.resolve({}) })).toBeNull();
    expect(carregarDadosEngajamento).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("mantém o gate aluno:read e rejeita antes de carregar dados", async () => {
    mocks.permitido.mockReturnValue(false);
    await expect(Pagina({ searchParams: Promise.resolve({ marca: "outra" }) })).rejects.toThrow(
      "redirect:/dashboard",
    );
    expect(mocks.permitido).toHaveBeenCalledWith("professor", "aluno:read");
    expect(carregarDadosEngajamento).not.toHaveBeenCalled();
  });
  it("não transforma falha de consulta em indicadores iguais a zero", async () => {
    vi.mocked(carregarDadosEngajamento).mockRejectedValue(new Error("timeout"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const pagina = await Pagina({ searchParams: Promise.resolve({}) });
      const html = renderToStaticMarkup(pagina!);
      expect(html).toContain("Indicadores temporariamente indisponíveis");
      expect(html).toContain('role="alert"');
      expect(html).not.toContain("Nenhum aluno");
      expect(html).not.toContain("0%");
    } finally {
      log.mockRestore();
    }
  });
  it("renderiza a visão pedagógica com os dados existentes", async () => {
    vi.mocked(carregarDadosEngajamento).mockResolvedValue(dadosBase());
    const pagina = await Pagina({ searchParams: Promise.resolve({ periodo: "7" }) });
    expect(renderToStaticMarkup(pagina!)).toContain("Painel pedagógico");
  });
});
