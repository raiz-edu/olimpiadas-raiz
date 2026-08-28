/**
 * Adapter único para APIs no formato OpenAI (`POST /chat/completions`) — issue #161.
 * Serve a OpenAI e o Groq (compatível): mesmas mensagens, mesmos blocos `image_url`.
 * Sem SDK: uma chamada `fetch`, com timeout e erro tipado.
 */
export type BlocoConteudo =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type Mensagem = {
  role: "system" | "user" | "assistant";
  content: string | BlocoConteudo[];
};

export type CampoMaxTokens = "max_completion_tokens" | "max_tokens";

export type ParametrosCompletion = {
  /** Nome do provedor, só para mensagens de erro/log. */
  nome: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Mensagem[];
  temperature?: number;
  maxTokens?: number;
  /** OpenAI aceita `max_completion_tokens`; o Groq ainda usa `max_tokens`. */
  campoMaxTokens?: CampoMaxTokens;
  /** Campos extras do provedor (ex.: `reasoning_effort`). */
  extra?: Record<string, unknown>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class ProvedorIAError extends Error {
  constructor(
    public readonly provedor: string,
    public readonly status: number | null,
    message: string,
  ) {
    super(`${provedor}: ${message}`);
    this.name = "ProvedorIAError";
  }
}

const TIMEOUT_PADRAO_MS = 60_000;

function resumirCorpoErro(texto: string): string {
  try {
    const json = JSON.parse(texto) as { error?: { message?: string } | string };
    if (typeof json.error === "string") return json.error;
    if (json.error?.message) return json.error.message;
  } catch {
    /* não era JSON */
  }
  return texto.replace(/\s+/g, " ").slice(0, 200);
}

export async function chatCompletion(p: ParametrosCompletion): Promise<string> {
  const fetchImpl = p.fetchImpl ?? fetch;
  const campoMax = p.campoMaxTokens ?? "max_completion_tokens";
  const body: Record<string, unknown> = { model: p.model, messages: p.messages };
  if (p.temperature !== undefined) body.temperature = p.temperature;
  if (p.maxTokens !== undefined) body[campoMax] = p.maxTokens;
  Object.assign(body, p.extra ?? {});

  const controller = new AbortController();
  const timeoutMs = p.timeoutMs ?? TIMEOUT_PADRAO_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resposta = await fetchImpl(`${p.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => "");
      throw new ProvedorIAError(
        p.nome,
        resposta.status,
        `HTTP ${resposta.status} (${p.model}): ${resumirCorpoErro(texto) || "sem detalhe"}`,
      );
    }

    const json = (await resposta.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    } | null;
    const conteudo = json?.choices?.[0]?.message?.content;
    if (typeof conteudo !== "string") {
      throw new ProvedorIAError(p.nome, resposta.status, `resposta sem conteúdo (${p.model})`);
    }
    return conteudo;
  } catch (e) {
    if (e instanceof ProvedorIAError) throw e;
    const err = e as Error;
    if (err.name === "AbortError") {
      throw new ProvedorIAError(
        p.nome,
        null,
        `sem resposta em ${Math.round(timeoutMs / 1000)} s (${p.model})`,
      );
    }
    throw new ProvedorIAError(p.nome, null, `falha de rede: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}
