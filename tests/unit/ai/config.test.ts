/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SPEC issue #161 — CA4

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

function makeAdmin(resultado: { data: unknown; error: { message: string } | null }) {
  const q: any = {};
  for (const m of ["select", "like", "eq", "in"]) q[m] = vi.fn(() => q);
  q.then = (resolve: (r: unknown) => void) => resolve(resultado);
  return { from: vi.fn(() => q) };
}

describe("montarConfigIA", () => {
  it("sem valores → defaults: OpenAI primário, Groq fallback, modelos default", async () => {
    const { montarConfigIA } = await import("@/lib/ai/config");
    const c = montarConfigIA({});
    expect(c.provedor).toBe("openai");
    expect(c.fallback).toBe("groq");
    expect(c.modelos.openai.texto).toBe("gpt-4.1-mini");
    expect(c.modelos.groq.visao).toBe("qwen/qwen3.6-27b");
  });

  it("valores do banco sobrescrevem; inválidos caem no default; fallback vazio → null", async () => {
    const { montarConfigIA } = await import("@/lib/ai/config");
    const c = montarConfigIA({
      ia_provedor: "groq",
      ia_fallback: "",
      ia_groq_modelo_texto: "  llama-x  ",
      ia_openai_modelo_visao: "",
    });
    expect(c.provedor).toBe("groq");
    expect(c.fallback).toBeNull();
    expect(c.modelos.groq.texto).toBe("llama-x");
    expect(c.modelos.openai.visao).toBe("gpt-4.1-mini"); // vazio não sobrescreve

    expect(montarConfigIA({ ia_provedor: "gemini" }).provedor).toBe("openai");
    expect(montarConfigIA({ ia_fallback: "gemini" }).fallback).toBe("groq");
  });

  it("fallback igual ao primário vira null", async () => {
    const { montarConfigIA } = await import("@/lib/ai/config");
    expect(montarConfigIA({ ia_provedor: "groq", ia_fallback: "groq" }).fallback).toBeNull();
  });
});

describe("getConfigIA", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("lê as linhas ia_* do banco e usa cache na segunda chamada", async () => {
    const admin = makeAdmin({
      data: [
        { chave: "ia_provedor", valor: "groq" },
        { chave: "ia_openai_modelo_texto", valor: "gpt-custom" },
      ],
      error: null,
    });
    mocks.createAdminClient.mockReturnValue(admin);
    const { getConfigIA, invalidarCacheConfigIA } = await import("@/lib/ai/config");

    const c1 = await getConfigIA();
    expect(c1.provedor).toBe("groq");
    expect(c1.modelos.openai.texto).toBe("gpt-custom");

    await getConfigIA();
    expect(admin.from).toHaveBeenCalledTimes(1);

    invalidarCacheConfigIA();
    await getConfigIA();
    expect(admin.from).toHaveBeenCalledTimes(2);
  });

  it("erro do banco → defaults + console.error, sem lançar", async () => {
    mocks.createAdminClient.mockReturnValue(makeAdmin({ data: null, error: { message: "boom" } }));
    const { getConfigIA } = await import("@/lib/ai/config");

    const c = await getConfigIA();
    expect(c.provedor).toBe("openai");
    expect(c.fallback).toBe("groq");
    expect(console.error).toHaveBeenCalled();
  });
});
