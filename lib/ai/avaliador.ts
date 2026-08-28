/**
 * Avaliação das questões discursivas (issue #161) — substitui lib/ai/groq.ts.
 *
 * Mesmas 4 funções, mesmos prompts. O que muda: o provedor vem da configuração
 * (OpenAI por padrão, Groq de reserva), a chave vem de /configuracoes/credenciais
 * e, se o primário falhar (chave ausente, rede, HTTP ≥ 400), o fallback assume —
 * com registro no log de quem falhou e quem respondeu.
 */
import { getCredencial } from "@/lib/credenciais/queries";
import { getConfigIA } from "./config";
import {
  containsPromptInjection,
  createInvalidImageFeedback,
  createPromptInjectionFeedback,
  extractExpectedItems,
  parseStrictFeedback,
  parseStrictTranscricaoFoto,
  type TranscricaoFotoAluno,
} from "./feedback-security";
import { chatCompletion, type BlocoConteudo, type Mensagem } from "./openai-compatible";
import {
  buildSolucaoImagensPrompt,
  buildTextPrompt,
  buildTranscricaoFotoPrompt,
  SYSTEM_PROMPT,
} from "./prompts";
import { PROVEDORES, type ProvedorIA } from "./provedores";
import type { FeedbackIA } from "./types";

export type TipoChamada = "texto" | "visao";

type OpcoesChamada = { temperature: number; maxTokens: number };

/**
 * Tenta o primário e depois o fallback. Lança só quando nenhum responde — a
 * Server Action que chama já converte isso em "Não foi possível avaliar agora".
 */
export async function completar(
  tipo: TipoChamada,
  messages: Mensagem[],
  opcoes: OpcoesChamada,
): Promise<string> {
  const config = await getConfigIA();
  const ordem: ProvedorIA[] = [config.provedor];
  if (config.fallback && config.fallback !== config.provedor) ordem.push(config.fallback);

  const motivos: string[] = [];
  for (const [i, nome] of ordem.entries()) {
    const def = PROVEDORES[nome];
    const model = tipo === "texto" ? config.modelos[nome].texto : config.modelos[nome].visao;
    const proximo = ordem[i + 1];
    const avisoProximo = proximo ? ` — tentando ${proximo}` : "";

    const apiKey = await getCredencial(def.credencial);
    if (!apiKey) {
      motivos.push(`${nome}: chave ausente`);
      console.error(`[ia] ${nome}: chave ausente${avisoProximo}`);
      continue;
    }

    try {
      const conteudo = await chatCompletion({
        nome,
        baseUrl: def.baseUrl,
        apiKey,
        model,
        messages,
        temperature: opcoes.temperature,
        maxTokens: opcoes.maxTokens,
        campoMaxTokens: def.campoMaxTokens,
        extra: tipo === "visao" ? def.extraVisao : undefined,
      });
      if (i > 0) console.warn(`[ia] respondeu pelo fallback ${nome} (${model})`);
      return conteudo;
    } catch (e) {
      const msg = (e as Error).message;
      motivos.push(msg);
      console.error(`[ia] ${nome} (${model}) falhou: ${msg}${avisoProximo}`);
    }
  }

  throw new Error(`Nenhum provedor de IA respondeu — ${motivos.join("; ")}`);
}

/** Uma completion mínima para o botão "Testar modelos" da tela de credenciais. */
export async function testarModelo(
  provedor: ProvedorIA,
  tipo: TipoChamada,
  model: string,
): Promise<{ ok: true; resposta: string } | { ok: false; erro: string }> {
  const def = PROVEDORES[provedor];
  const apiKey = await getCredencial(def.credencial, { semCache: true });
  if (!apiKey) return { ok: false, erro: `${def.rotulo}: chave ausente.` };
  try {
    const resposta = await chatCompletion({
      nome: provedor,
      baseUrl: def.baseUrl,
      apiKey,
      model,
      messages: [{ role: "user", content: "Responda apenas com a palavra OK." }],
      maxTokens: 20,
      campoMaxTokens: def.campoMaxTokens,
      extra: tipo === "visao" ? def.extraVisao : undefined,
      timeoutMs: 20_000,
    });
    return { ok: true, resposta: resposta.trim().slice(0, 40) };
  } catch (e) {
    return { ok: false, erro: (e as Error).message };
  }
}

// ─── API pública (mesmo contrato de lib/ai/groq.ts) ───────────────────────────

export async function avaliarRespostaAberta(
  enunciado: string,
  solucao: string,
  resposta: string,
): Promise<FeedbackIA> {
  const expectedItems = extractExpectedItems(enunciado);
  const conteudo = await completar(
    "texto",
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildTextPrompt(enunciado, solucao, resposta) },
    ],
    { temperature: 0.1, maxTokens: 800 },
  );
  return parseStrictFeedback(conteudo, expectedItems);
}

export async function transcreverFotoAluno(
  enunciado: string,
  fotoAlunoBase64: string,
): Promise<TranscricaoFotoAluno> {
  const content: BlocoConteudo[] = [
    { type: "text", text: buildTranscricaoFotoPrompt(enunciado) },
    { type: "image_url", image_url: { url: fotoAlunoBase64 } },
  ];
  const conteudo = await completar("visao", [{ role: "user", content }], {
    temperature: 0,
    maxTokens: 500,
  });
  return parseStrictTranscricaoFoto(conteudo);
}

// Avalia foto por transcricao segura; mantida para compatibilidade interna.
export async function avaliarFotoAberta(
  enunciado: string,
  textoSolucao: string,
  _imagensSolucaoUrls: string[],
  fotoAlunoBase64: string,
): Promise<FeedbackIA> {
  const transcricao = await transcreverFotoAluno(enunciado, fotoAlunoBase64);

  if (transcricao.tipo !== "resolucao") {
    return createInvalidImageFeedback(enunciado, transcricao.tipo);
  }

  if (containsPromptInjection(transcricao.transcricao)) {
    return createPromptInjectionFeedback(enunciado);
  }

  return avaliarRespostaAberta(enunciado, textoSolucao, transcricao.transcricao);
}

// Transcreve o conteudo da solucao oficial a partir de imagens, sem avaliar.
async function extrairTextoSolucaoDeImagens(
  enunciado: string,
  imagensSolucaoUrls: string[],
): Promise<string> {
  const content: BlocoConteudo[] = [{ type: "text", text: buildSolucaoImagensPrompt(enunciado) }];
  for (const url of imagensSolucaoUrls) content.push({ type: "image_url", image_url: { url } });

  const conteudo = await completar("visao", [{ role: "user", content }], {
    temperature: 0.1,
    maxTokens: 800,
  });
  return conteudo.trim();
}

// Avalia quando a solucao oficial esta disponivel apenas como imagem.
export async function avaliarRespostaAbertaComImagem(
  enunciado: string,
  imagensSolucaoUrls: string[],
  resposta: string,
): Promise<FeedbackIA> {
  const textoSolucao = await extrairTextoSolucaoDeImagens(enunciado, imagensSolucaoUrls);
  return avaliarRespostaAberta(enunciado, textoSolucao, resposta);
}
