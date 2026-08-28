/**
 * Provedores de IA conhecidos (issue #161). Os modelos aqui são só o ponto de
 * partida: o que vale em produção é o que está em configuracao_sistema, editável
 * no card "Avaliação por IA" de /configuracoes/credenciais.
 */
import type { CredencialChave } from "@/lib/credenciais/catalogo";
import type { CampoMaxTokens } from "./openai-compatible";

export type ProvedorIA = "openai" | "groq";

export type DefinicaoProvedor = {
  rotulo: string;
  baseUrl: string;
  credencial: CredencialChave;
  campoMaxTokens: CampoMaxTokens;
  modeloTextoDefault: string;
  modeloVisaoDefault: string;
  /** Campos extras enviados só nas chamadas de visão. */
  extraVisao?: Record<string, unknown>;
};

export const PROVEDORES: Record<ProvedorIA, DefinicaoProvedor> = {
  openai: {
    rotulo: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    credencial: "openai_api_key",
    campoMaxTokens: "max_completion_tokens",
    modeloTextoDefault: "gpt-4.1-mini",
    modeloVisaoDefault: "gpt-4.1-mini",
  },
  groq: {
    rotulo: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    credencial: "groq_api_key",
    campoMaxTokens: "max_tokens",
    modeloTextoDefault: "llama-3.3-70b-versatile",
    // llama-4-scout foi descontinuado pelo Groq; qwen3.6 é o modelo com visão disponível.
    modeloVisaoDefault: "qwen/qwen3.6-27b",
    // Obrigatório no qwen: sem isso ele responde com <think> antes do JSON.
    extraVisao: { reasoning_effort: "none" },
  },
};

export const PROVEDORES_IA = Object.keys(PROVEDORES) as ProvedorIA[];

export function isProvedorIA(valor: unknown): valor is ProvedorIA {
  return typeof valor === "string" && valor in PROVEDORES;
}
