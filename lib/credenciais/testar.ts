/**
 * Teste de conectividade de uma chave (issue #159): uma chamada barata de leitura
 * ao provedor, sem gastar tokens. Roda só no servidor, com a chave já decifrada.
 */
import type { TesteProvedor } from "./catalogo";

export type ResultadoTeste = { ok: true; detalhe: string } | { ok: false; erro: string };

const ENDPOINTS: Record<TesteProvedor, string> = {
  openai: "https://api.openai.com/v1/models",
  groq: "https://api.groq.com/openai/v1/models",
};

const TIMEOUT_MS = 10_000;

export async function testarChave(
  provedor: TesteProvedor,
  valor: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResultadoTeste> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetchImpl(ENDPOINTS[provedor], {
      headers: { Authorization: `Bearer ${valor}` },
      signal: controller.signal,
    });
    if (resposta.status === 401 || resposta.status === 403) {
      return {
        ok: false,
        erro: `Chave recusada pelo provedor (HTTP ${resposta.status}). Confira se colou a chave inteira e se ela não foi revogada.`,
      };
    }
    if (!resposta.ok) return { ok: false, erro: `Provedor respondeu HTTP ${resposta.status}.` };

    const corpo = (await resposta.json().catch(() => null)) as { data?: unknown[] } | null;
    const modelos = Array.isArray(corpo?.data) ? corpo.data.length : null;
    return {
      ok: true,
      detalhe:
        modelos !== null ? `Chave aceita — ${modelos} modelos disponíveis.` : "Chave aceita.",
    };
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError") return { ok: false, erro: "Provedor não respondeu em 10 s." };
    return { ok: false, erro: `Falha de rede ao chamar o provedor: ${err.message}` };
  } finally {
    clearTimeout(timer);
  }
}
