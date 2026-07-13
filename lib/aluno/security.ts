export type ContextoResposta = "banco" | "aula" | "simulado";

export type RespostaSimuladoSanitizada = {
  correta: boolean;
  alternativa_id: string;
  alternativa_correta_id: string | null;
};

export type RespostasSimuladoSanitizadas = Record<string, RespostaSimuladoSanitizada>;

type AlternativaInfo = {
  id: string;
  questao_id: string;
  correta: boolean;
};

export const RESPOSTA_ABERTA_MAX_CHARS = 4000;
export const IMAGEM_RESPOSTA_MAX_BYTES = 2 * 1024 * 1024;

export function normalizeContextoResposta(raw: FormDataEntryValue | null): ContextoResposta | null {
  const value = typeof raw === "string" && raw.trim() ? raw.trim() : "banco";
  if (value === "banco" || value === "aula" || value === "simulado") return value;
  return null;
}

export function normalizeOptionalId(raw: FormDataEntryValue | null): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function validateContextoAula(
  contexto: ContextoResposta,
  aulaId: string | null,
): string | null {
  if (contexto === "banco" && aulaId) return "Dados inválidos para treino livre.";
  if ((contexto === "aula" || contexto === "simulado") && !aulaId) {
    return "Dados inválidos para esta atividade.";
  }
  return null;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  const payload = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

export function validateRespostaAbertaPayload(
  respostaTexto: string,
  imagemBase64: string,
): string | null {
  if (respostaTexto.length > RESPOSTA_ABERTA_MAX_CHARS) {
    return `Sua resposta excedeu o limite máximo de ${RESPOSTA_ABERTA_MAX_CHARS.toLocaleString("pt-BR")} caracteres. Reduza o texto e envie novamente.`;
  }

  if (!imagemBase64) return null;

  if (!imagemBase64.startsWith("data:image/")) {
    return "A imagem enviada é inválida.";
  }

  if (estimateDataUrlBytes(imagemBase64) > IMAGEM_RESPOSTA_MAX_BYTES) {
    return "A imagem deve ter no máximo 2 MB.";
  }

  return null;
}

export function sanitizeRespostasSimulado(
  respostas: Record<string, { alternativa_id?: string | null; [key: string]: unknown } | undefined>,
  questoesPermitidas: Set<string>,
  alternativasPorId: Map<string, AlternativaInfo>,
  alternativaCorretaPorQuestao: Map<string, string>,
): RespostasSimuladoSanitizadas {
  const sanitizadas: RespostasSimuladoSanitizadas = {};

  for (const [questaoId, resposta] of Object.entries(respostas)) {
    if (!questoesPermitidas.has(questaoId)) continue;

    const alternativaId =
      typeof resposta?.alternativa_id === "string" ? resposta.alternativa_id.trim() : "";
    if (!alternativaId) continue;

    const alternativa = alternativasPorId.get(alternativaId);
    if (!alternativa || alternativa.questao_id !== questaoId) continue;

    sanitizadas[questaoId] = {
      alternativa_id: alternativa.id,
      correta: alternativa.correta === true,
      alternativa_correta_id: alternativaCorretaPorQuestao.get(questaoId) ?? null,
    };
  }

  return sanitizadas;
}
