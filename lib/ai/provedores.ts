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
  /** Campos extras por tipo de chamada (ex.: `reasoning_effort`). */
  extra?: Partial<Record<"texto" | "visao", Record<string, unknown>>>;
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
    // llama-3.3-70b-versatile (o default histórico) sumiu do Groq — HTTP 404 em
    // 2026-08-28. Dos 6 modelos de chat restantes, gpt-oss-120b devolve o JSON
    // limpo em ~0,8 s com reasoning_effort "low".
    modeloTextoDefault: "openai/gpt-oss-120b",
    // llama-4-scout foi descontinuado pelo Groq; qwen3.6 é o modelo com visão disponível.
    modeloVisaoDefault: "qwen/qwen3.6-27b",
    extra: {
      texto: { reasoning_effort: "low" },
      // Obrigatório no qwen: sem isso ele responde com <think> antes do JSON.
      visao: { reasoning_effort: "none" },
    },
  },
};

export const PROVEDORES_IA = Object.keys(PROVEDORES) as ProvedorIA[];

export function isProvedorIA(valor: unknown): valor is ProvedorIA {
  return typeof valor === "string" && valor in PROVEDORES;
}
