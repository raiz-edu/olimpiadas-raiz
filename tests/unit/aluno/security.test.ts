import { describe, expect, it } from "vitest";
import {
  IMAGEM_RESPOSTA_MAX_BYTES,
  RESPOSTA_ABERTA_MAX_CHARS,
  estimateDataUrlBytes,
  normalizeContextoResposta,
  sanitizeRespostasSimulado,
  validateContextoAula,
  validateRespostaAbertaPayload,
} from "@/lib/aluno/security";

describe("student answer security helpers", () => {
  it("normalizes accepted contexts and rejects invalid context values", () => {
    expect(normalizeContextoResposta(null)).toBe("banco");
    expect(normalizeContextoResposta("banco")).toBe("banco");
    expect(normalizeContextoResposta(" aula ")).toBe("aula");
    expect(normalizeContextoResposta("simulado")).toBe("simulado");
    expect(normalizeContextoResposta("admin")).toBeNull();
  });

  it("rejects aula_id in banco context and requires it for aula/simulado", () => {
    expect(validateContextoAula("banco", "aula-1")).toBeTruthy();
    expect(validateContextoAula("aula", null)).toBeTruthy();
    expect(validateContextoAula("simulado", null)).toBeTruthy();
    expect(validateContextoAula("banco", null)).toBeNull();
    expect(validateContextoAula("aula", "aula-1")).toBeNull();
    expect(validateContextoAula("simulado", "simulado-1")).toBeNull();
  });

  it("enforces open-answer text and image payload limits", () => {
    expect(validateRespostaAbertaPayload("x".repeat(RESPOSTA_ABERTA_MAX_CHARS), "")).toBeNull();
    expect(
      validateRespostaAbertaPayload("x".repeat(RESPOSTA_ABERTA_MAX_CHARS + 1), ""),
    ).toBeTruthy();
    expect(validateRespostaAbertaPayload("", "not-an-image")).toBeTruthy();
    expect(validateRespostaAbertaPayload("", "data:image/png;base64,AAAA")).toBeNull();

    const tooLargeImage = `data:image/png;base64,${"A".repeat(
      Math.ceil(((IMAGEM_RESPOSTA_MAX_BYTES + 1) * 4) / 3),
    )}`;
    expect(estimateDataUrlBytes(tooLargeImage)).toBeGreaterThan(IMAGEM_RESPOSTA_MAX_BYTES);
    expect(validateRespostaAbertaPayload("", tooLargeImage)).toBeTruthy();
  });

  it("sanitizes simulated-test answers from server-side question and alternative data", () => {
    const result = sanitizeRespostasSimulado(
      {
        "q-1": {
          alternativa_id: "alt-1-wrong",
          correta: true,
          alternativa_correta_id: "client-forged",
        },
        "q-2": {
          alternativa_id: "alt-2-correct",
          correta: false,
          alternativa_correta_id: null,
        },
        "q-not-in-test": {
          alternativa_id: "alt-outside",
          correta: true,
          alternativa_correta_id: "alt-outside",
        },
        "q-3": {
          alternativa_id: "alt-from-other-question",
          correta: true,
          alternativa_correta_id: "alt-3-correct",
        },
      },
      new Set(["q-1", "q-2", "q-3"]),
      new Map([
        ["alt-1-wrong", { id: "alt-1-wrong", questao_id: "q-1", correta: false }],
        ["alt-2-correct", { id: "alt-2-correct", questao_id: "q-2", correta: true }],
        [
          "alt-from-other-question",
          { id: "alt-from-other-question", questao_id: "q-9", correta: true },
        ],
      ]),
      new Map([
        ["q-1", "alt-1-correct"],
        ["q-2", "alt-2-correct"],
        ["q-3", "alt-3-correct"],
      ]),
    );

    expect(result).toEqual({
      "q-1": {
        alternativa_id: "alt-1-wrong",
        correta: false,
        alternativa_correta_id: "alt-1-correct",
      },
      "q-2": {
        alternativa_id: "alt-2-correct",
        correta: true,
        alternativa_correta_id: "alt-2-correct",
      },
    });
  });
});
