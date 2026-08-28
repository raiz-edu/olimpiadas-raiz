import { describe, expect, it, vi } from "vitest";
import { chatCompletion, ProvedorIAError } from "@/lib/ai/openai-compatible";

// SPEC issue #161 — CA1

type Chamada = { url: string; init: RequestInit };

function fetchFalso(resposta: { status: number; body: unknown }) {
  const chamadas: Chamada[] = [];
  const impl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    chamadas.push({ url: String(url), init: init ?? {} });
    const texto = typeof resposta.body === "string" ? resposta.body : JSON.stringify(resposta.body);
    return new Response(texto, { status: resposta.status });
  }) as unknown as typeof fetch;
  return { chamadas, impl };
}

const BASE = {
  nome: "openai",
  baseUrl: "https://api.openai.com/v1/",
  apiKey: "sk-teste",
  model: "gpt-teste",
  messages: [{ role: "user" as const, content: "oi" }],
};

describe("chatCompletion", () => {
  it("monta a request no formato OpenAI e devolve o conteúdo da primeira escolha", async () => {
    const f = fetchFalso({
      status: 200,
      body: { choices: [{ message: { content: '{"ok":true}' } }] },
    });

    const saida = await chatCompletion({
      ...BASE,
      temperature: 0.1,
      maxTokens: 800,
      fetchImpl: f.impl,
    });

    expect(saida).toBe('{"ok":true}');
    expect(f.chamadas).toHaveLength(1);
    const { url, init } = f.chamadas[0]!;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-teste");
    expect(JSON.parse(String(init.body))).toEqual({
      model: "gpt-teste",
      messages: [{ role: "user", content: "oi" }],
      temperature: 0.1,
      max_completion_tokens: 800,
    });
  });

  it("usa max_tokens e mescla extras quando o provedor pede (Groq)", async () => {
    const f = fetchFalso({ status: 200, body: { choices: [{ message: { content: "x" } }] } });

    await chatCompletion({
      ...BASE,
      nome: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      maxTokens: 500,
      campoMaxTokens: "max_tokens",
      extra: { reasoning_effort: "none" },
      fetchImpl: f.impl,
    });

    const body = JSON.parse(String(f.chamadas[0]!.init.body));
    expect(body.max_tokens).toBe(500);
    expect(body.max_completion_tokens).toBeUndefined();
    expect(body.reasoning_effort).toBe("none");
    expect(body.temperature).toBeUndefined();
  });

  it("HTTP ≥ 400 → ProvedorIAError com status e a mensagem do corpo", async () => {
    const f = fetchFalso({
      status: 401,
      body: { error: { message: "Incorrect API key provided" } },
    });

    const erro = await chatCompletion({ ...BASE, fetchImpl: f.impl }).catch((e) => e);
    expect(erro).toBeInstanceOf(ProvedorIAError);
    expect(erro.status).toBe(401);
    expect(erro.provedor).toBe("openai");
    expect(erro.message).toBe("openai: HTTP 401 (gpt-teste): Incorrect API key provided");
  });

  it("corpo sem conteúdo → ProvedorIAError", async () => {
    const f = fetchFalso({ status: 200, body: { choices: [] } });
    await expect(chatCompletion({ ...BASE, fetchImpl: f.impl })).rejects.toThrow(
      "resposta sem conteúdo",
    );
  });

  it("timeout → ProvedorIAError com o tempo, sem vazar AbortError", async () => {
    const impl = ((_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      })) as unknown as typeof fetch;

    const erro = await chatCompletion({ ...BASE, timeoutMs: 20, fetchImpl: impl }).catch((e) => e);
    expect(erro).toBeInstanceOf(ProvedorIAError);
    expect(erro.status).toBeNull();
    expect(erro.message).toContain("sem resposta em 0 s");
  });

  it("falha de rede → ProvedorIAError com a causa", async () => {
    const impl = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    await expect(chatCompletion({ ...BASE, fetchImpl: impl })).rejects.toThrow(
      "openai: falha de rede: ECONNRESET",
    );
  });
});
