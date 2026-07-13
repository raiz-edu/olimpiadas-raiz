import type { FeedbackIA, ItemAvaliacao } from "./types";

export type TipoTranscricaoFoto = "resolucao" | "invalida" | "ilegivel" | "irrelevante";

export type TranscricaoFotoAluno = {
  tipo: TipoTranscricaoFoto;
  transcricao: string;
};

const VALID_STATUSES = new Set<ItemAvaliacao["status"]>([
  "correto",
  "parcial",
  "incorreto",
  "nao_respondido",
]);

const INJECTION_PATTERNS = [
  /\bignore\b.*\bsolucao\s+oficial\b/i,
  /\bmarque\b.*\btudo\b.*\bcorreto\b/i,
  /\brespondeu\b.*\bcorretamente\b.*\btodos\b.*\bitens\b/i,
  /\besta\s+imagem\s+e\s+a\s+solucao\s+oficial\b/i,
  /\bnao\s+a\s+resposta\s+do\s+aluno\b/i,
  /\bnova\s+instrucao\b/i,
  /\bignore\b.*\b(instrucoes|prompt|sistema|avaliador)\b/i,
  /\bignorar\b.*\b(instrucoes|prompt|sistema|avaliador)\b/i,
  /\bdesconsidere\b.*\b(instrucoes|prompt|sistema|avaliador)\b/i,
  /\binstrucoes?\s+anteriores\b/i,
  /\bretorne\b.*\bjson\b/i,
  /\bretorne\b\s*\{/i,
  /\bresponda\b.*\bjson\b/i,
  /\bresponda\b\s*\{/i,
  /\bdevolva\b.*\bjson\b/i,
  /\bdevolva\b\s*\{/i,
  /\b(system|developer|assistant)\s*(prompt|message|role|:)/i,
  /\bmensagem\s+do\s+sistema\b/i,
  /\bvoce\s+agora\s+e\b/i,
  /\baja\s+como\b.*\b(avaliador|sistema|assistente)\b/i,
  /\bfim\s+da\s+resposta\s+do\s+aluno\b/i,
  /\bresposta\s+do\s+aluno\s+terminou\b/i,
];

const TIPOS_TRANSCRICAO_FOTO = new Set<TipoTranscricaoFoto>([
  "resolucao",
  "invalida",
  "ilegivel",
  "irrelevante",
]);

export function extractExpectedItems(enunciado: string): string[] {
  const items = new Set<string>();
  const regex = /(?:^|[\s\n\r])([a-z])\)/gi;

  for (const match of enunciado.matchAll(regex)) {
    const item = match[1]?.toLowerCase();
    if (item) items.add(item);
  }

  return [...items].sort((a, b) => a.localeCompare(b));
}

export function containsPromptInjection(resposta: string): boolean {
  const normalized = resposta
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function createPromptInjectionFeedback(enunciado: string): FeedbackIA {
  const items = extractExpectedItems(enunciado);
  const itemIds = items.length > 0 ? items : ["resposta"];

  return {
    itens: itemIds.map((item) => ({
      item,
      status: "incorreto",
      comentario: "A resposta contem instrucoes ao avaliador em vez de uma resolucao matematica.",
    })),
    resumo: "Resposta invalida: foram detectadas instrucoes ao avaliador.",
  };
}

export function createInvalidImageFeedback(
  enunciado: string,
  tipo: Exclude<TipoTranscricaoFoto, "resolucao">,
): FeedbackIA {
  const items = extractExpectedItems(enunciado);
  const itemIds = items.length > 0 ? items : ["resposta"];
  const comentario =
    tipo === "ilegivel"
      ? "A imagem enviada nao contem texto legivel suficiente para avaliar a resolucao."
      : "A imagem enviada nao contem uma resolucao matematica avaliavel para esta questao.";

  return {
    itens: itemIds.map((item) => ({
      item,
      status: "incorreto",
      comentario,
    })),
    resumo: comentario,
  };
}

export function parseStrictTranscricaoFoto(raw: string): TranscricaoFotoAluno {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("Transcricao inesperada da IA");
  }

  const parsed = JSON.parse(trimmed) as { tipo?: unknown; transcricao?: unknown };
  if (
    typeof parsed.tipo !== "string" ||
    !TIPOS_TRANSCRICAO_FOTO.has(parsed.tipo as TipoTranscricaoFoto)
  ) {
    throw new Error("Tipo de transcricao invalido");
  }
  if (typeof parsed.transcricao !== "string") {
    throw new Error("Transcricao invalida");
  }

  return {
    tipo: parsed.tipo as TipoTranscricaoFoto,
    transcricao: parsed.transcricao.trim(),
  };
}

export function parseStrictFeedback(raw: string, expectedItems: string[]): FeedbackIA {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("Resposta inesperada da IA");
  }

  return normalizeFeedback(JSON.parse(trimmed), expectedItems);
}

export function normalizeFeedback(raw: unknown, expectedItems: string[]): FeedbackIA {
  if (!raw || typeof raw !== "object") throw new Error("Feedback invalido");

  const feedback = raw as { itens?: unknown; resumo?: unknown };
  if (!Array.isArray(feedback.itens)) throw new Error("Feedback sem itens");

  const byItem = new Map<string, ItemAvaliacao>();
  for (const rawItem of feedback.itens) {
    if (!rawItem || typeof rawItem !== "object") throw new Error("Item de feedback invalido");
    const item = rawItem as { item?: unknown; status?: unknown; comentario?: unknown };
    if (typeof item.item !== "string") throw new Error("Item de feedback sem identificador");
    if (!VALID_STATUSES.has(item.status as ItemAvaliacao["status"])) {
      throw new Error("Status de feedback invalido");
    }

    byItem.set(item.item.trim().toLowerCase(), {
      item: item.item.trim().toLowerCase(),
      status: item.status as ItemAvaliacao["status"],
      comentario: typeof item.comentario === "string" ? item.comentario : "",
    });
  }

  const itemIds =
    expectedItems.length > 0
      ? expectedItems
      : [...byItem.keys()].sort((a, b) => a.localeCompare(b));

  if (itemIds.length === 0) throw new Error("Feedback sem itens esperados");

  return {
    itens: itemIds.map(
      (item): ItemAvaliacao =>
        byItem.get(item) ?? {
          item,
          status: "nao_respondido",
          comentario: "O aluno nao forneceu resposta para este item.",
        },
    ),
    resumo: typeof feedback.resumo === "string" ? feedback.resumo : "",
  };
}
