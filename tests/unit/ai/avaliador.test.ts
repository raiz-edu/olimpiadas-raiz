import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigIA } from "@/lib/ai/config";

// SPEC issue #161 — CA2 e CA3

const mocks = vi.hoisted(() => ({
  chatCompletion: vi.fn(),
  getCredencial: vi.fn(),
  getConfigIA: vi.fn(),
}));

vi.mock("@/lib/ai/openai-compatible", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return { ...original, chatCompletion: mocks.chatCompletion };
});
vi.mock("@/lib/credenciais/queries", () => ({ getCredencial: mocks.getCredencial }));
vi.mock("@/lib/ai/config", () => ({ getConfigIA: mocks.getConfigIA }));

const CONFIG: ConfigIA = {
  provedor: "openai",
  fallback: "groq",
  modelos: {
    openai: { texto: "gpt-texto", visao: "gpt-visao" },
    groq: { texto: "llama-texto", visao: "qwen-visao" },
  },
};

const CHAVES: Record<string, string | null> = {
  openai_api_key: "sk-openai",
  groq_api_key: "gsk-groq",
};

const FEEDBACK_JSON = JSON.stringify({
  itens: [{ item: "a", status: "correto", comentario: "Certo." }],
  resumo: "Muito bem.",
});

describe("completar — cadeia primário → fallback", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConfigIA.mockResolvedValue(CONFIG);
    mocks.getCredencial.mockImplementation(async (chave: string) => CHAVES[chave] ?? null);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("primário responde → uma chamada, modelo e campo de max tokens da OpenAI, sem log", async () => {
    mocks.chatCompletion.mockResolvedValue("resposta");
    const { completar } = await import("@/lib/ai/avaliador");

    const saida = await completar("texto", [{ role: "user", content: "x" }], {
      temperature: 0.1,
      maxTokens: 800,
    });

    expect(saida).toBe("resposta");
    expect(mocks.chatCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.chatCompletion.mock.calls[0]![0]).toMatchObject({
      nome: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-openai",
      model: "gpt-texto",
      temperature: 0.1,
      maxTokens: 800,
      campoMaxTokens: "max_completion_tokens",
      extra: undefined,
    });
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("primário falha (HTTP) → fallback com o modelo do Groq, erro e aviso no log", async () => {
    mocks.chatCompletion
      .mockRejectedValueOnce(new Error("openai: HTTP 429 (gpt-texto): rate limit"))
      .mockResolvedValueOnce("pelo groq");
    const { completar } = await import("@/lib/ai/avaliador");

    const saida = await completar("texto", [{ role: "user", content: "x" }], {
      temperature: 0.1,
      maxTokens: 800,
    });

    expect(saida).toBe("pelo groq");
    expect(mocks.chatCompletion).toHaveBeenCalledTimes(2);
    expect(mocks.chatCompletion.mock.calls[1]![0]).toMatchObject({
      nome: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "gsk-groq",
      model: "llama-texto",
      campoMaxTokens: "max_tokens",
      extra: { reasoning_effort: "low" },
    });
    expect(consoleError.mock.calls[0]!.join(" ")).toContain("rate limit");
    expect(consoleError.mock.calls[0]!.join(" ")).toContain("tentando groq");
    expect(consoleWarn.mock.calls[0]!.join(" ")).toContain("fallback groq (llama-texto)");
  });

  it("primário sem chave → vai direto ao fallback, sem chamar o primário", async () => {
    mocks.getCredencial.mockImplementation(async (chave: string) =>
      chave === "groq_api_key" ? "gsk-groq" : null,
    );
    mocks.chatCompletion.mockResolvedValue("pelo groq");
    const { completar } = await import("@/lib/ai/avaliador");

    await completar("texto", [{ role: "user", content: "x" }], { temperature: 0, maxTokens: 10 });

    expect(mocks.chatCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.chatCompletion.mock.calls[0]![0]).toMatchObject({ nome: "groq" });
    expect(consoleError.mock.calls[0]!.join(" ")).toContain("openai: chave ausente");
  });

  it("visão: extra reasoning_effort só no Groq", async () => {
    mocks.chatCompletion
      .mockRejectedValueOnce(new Error("openai: falha de rede: x"))
      .mockResolvedValueOnce("ok");
    const { completar } = await import("@/lib/ai/avaliador");

    await completar("visao", [{ role: "user", content: "x" }], { temperature: 0, maxTokens: 500 });

    expect(mocks.chatCompletion.mock.calls[0]![0]).toMatchObject({
      model: "gpt-visao",
      extra: undefined,
    });
    expect(mocks.chatCompletion.mock.calls[1]![0]).toMatchObject({
      model: "qwen-visao",
      extra: { reasoning_effort: "none" },
    });
  });

  it("ambos falham → erro listando os dois motivos", async () => {
    mocks.chatCompletion
      .mockRejectedValueOnce(new Error("openai: HTTP 500 (gpt-texto): boom"))
      .mockRejectedValueOnce(new Error("groq: falha de rede: ECONNRESET"));
    const { completar } = await import("@/lib/ai/avaliador");

    await expect(
      completar("texto", [{ role: "user", content: "x" }], { temperature: 0, maxTokens: 10 }),
    ).rejects.toThrow(
      "Nenhum provedor de IA respondeu — openai: HTTP 500 (gpt-texto): boom; groq: falha de rede: ECONNRESET",
    );
  });

  it("sem fallback configurado → só o primário", async () => {
    mocks.getConfigIA.mockResolvedValue({ ...CONFIG, fallback: null });
    mocks.chatCompletion.mockRejectedValueOnce(new Error("openai: HTTP 500 (gpt-texto): boom"));
    const { completar } = await import("@/lib/ai/avaliador");

    await expect(
      completar("texto", [{ role: "user", content: "x" }], { temperature: 0, maxTokens: 10 }),
    ).rejects.toThrow("Nenhum provedor de IA respondeu");
    expect(mocks.chatCompletion).toHaveBeenCalledTimes(1);
  });
});

describe("avaliarRespostaAberta (integração com parseStrictFeedback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConfigIA.mockResolvedValue(CONFIG);
    mocks.getCredencial.mockImplementation(async (chave: string) => CHAVES[chave] ?? null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("devolve FeedbackIA a partir do JSON do modelo, com system prompt e prompt do aluno", async () => {
    mocks.chatCompletion.mockResolvedValue(FEEDBACK_JSON);
    const { avaliarRespostaAberta } = await import("@/lib/ai/avaliador");

    const feedback = await avaliarRespostaAberta("a) Calcule 2+2.", "4", "4");

    expect(feedback.itens).toEqual([{ item: "a", status: "correto", comentario: "Certo." }]);
    expect(feedback.resumo).toBe("Muito bem.");
    const params = mocks.chatCompletion.mock.calls[0]![0];
    expect(params.messages[0].role).toBe("system");
    expect(params.messages[1].content).toContain("<RESPOSTA_DO_ALUNO>\n4\n</RESPOSTA_DO_ALUNO>");
    expect(params.messages[1].content).toContain("Itens esperados no JSON: a.");
  });

  it("JSON inválido do modelo → erro 'Resposta inesperada da IA' (não vira feedback)", async () => {
    mocks.chatCompletion.mockResolvedValue("Claro! Aqui está: {...}");
    const { avaliarRespostaAberta } = await import("@/lib/ai/avaliador");

    await expect(avaliarRespostaAberta("a) Calcule.", "4", "4")).rejects.toThrow(
      "Resposta inesperada da IA",
    );
  });
});

describe("testarModelo (botão 'Testar modelos')", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCredencial.mockImplementation(async (chave: string) => CHAVES[chave] ?? null);
  });

  it("resposta com texto → ok, com orçamento de tokens suficiente para modelos com raciocínio", async () => {
    mocks.chatCompletion.mockResolvedValue("  OK  ");
    const { testarModelo } = await import("@/lib/ai/avaliador");

    expect(await testarModelo("groq", "texto", "openai/gpt-oss-120b")).toEqual({
      ok: true,
      resposta: "OK",
    });
    expect(mocks.chatCompletion.mock.calls[0]![0]).toMatchObject({
      nome: "groq",
      model: "openai/gpt-oss-120b",
      maxTokens: 256,
      extra: { reasoning_effort: "low" },
    });
  });

  it("resposta vazia NÃO é ok — foi o que a produção mostrou como 'ok (\"\")'", async () => {
    mocks.chatCompletion.mockResolvedValue("   ");
    const { testarModelo } = await import("@/lib/ai/avaliador");

    const r = await testarModelo("groq", "texto", "openai/gpt-oss-120b");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.erro).toContain("resposta vazia");
  });

  it("sem chave → erro nomeando o provedor, sem chamar a API", async () => {
    mocks.getCredencial.mockResolvedValue(null);
    const { testarModelo } = await import("@/lib/ai/avaliador");

    expect(await testarModelo("openai", "texto", "gpt-4.1-mini")).toEqual({
      ok: false,
      erro: "OpenAI: chave ausente.",
    });
    expect(mocks.chatCompletion).not.toHaveBeenCalled();
  });
});
