import { describe, expect, it } from "vitest";
import {
  faseLabel,
  FASES_POR_OLIMPIADA,
  NIVEIS_POR_OLIMPIADA,
  NIVEIS_TODOS,
  NIVEL_LABEL,
  OLIMPIADA_LABEL,
  OLIMPIADAS_FASE_UNICA,
} from "@/lib/questoes/olimpiadas";

describe("faseLabel", () => {
  it("mantém 1ª/2ª Fase nas olimpíadas de duas fases", () => {
    expect(faseLabel("obmep", 1)).toBe("1ª Fase");
    expect(faseLabel("obmep", 2)).toBe("2ª Fase");
    expect(faseLabel("obmep_mirim", 2)).toBe("2ª Fase");
  });

  it("mantém Fase Única nas olimpíadas de fase única", () => {
    for (const o of OLIMPIADAS_FASE_UNICA) {
      expect(faseLabel(o, 1)).toBe("Fase Única");
    }
  });

  it("rotula a modalidade da Mandacaru em vez de fase", () => {
    expect(faseLabel("mandacaru", 1)).toBe("Online");
    expect(faseLabel("mandacaru", 2)).toBe("Presencial");
  });

  it("aceita fase como string (vem da URL nos filtros)", () => {
    expect(faseLabel("mandacaru", "2")).toBe("Presencial");
    expect(faseLabel("canguru", "1")).toBe("Fase Única");
    expect(faseLabel("obmep", "1")).toBe("1ª Fase");
  });

  it("retorna vazio quando não há fase", () => {
    expect(faseLabel("mandacaru", null)).toBe("");
    expect(faseLabel("obmep", undefined)).toBe("");
    expect(faseLabel("obmep", "")).toBe("");
  });

  it("cai no rótulo genérico para origem desconhecida ou fase não declarada", () => {
    expect(faseLabel("origem_nova", 1)).toBe("1ª Fase");
    expect(faseLabel(null, 3)).toBe("3ª Fase");
    // Mandacaru não declara fase 3 — não deve inventar rótulo de modalidade.
    expect(faseLabel("mandacaru", 3)).toBe("3ª Fase");
  });
});

describe("consistência dos mapas de olimpíada", () => {
  it("toda origem com níveis declarados tem label e fases", () => {
    for (const origem of Object.keys(NIVEIS_POR_OLIMPIADA)) {
      expect(OLIMPIADA_LABEL[origem], `label de ${origem}`).toBeTruthy();
      expect(FASES_POR_OLIMPIADA[origem], `fases de ${origem}`).toBeTruthy();
    }
  });

  it("todo nível declarado por uma origem tem label e está em NIVEIS_TODOS", () => {
    for (const [origem, niveis] of Object.entries(NIVEIS_POR_OLIMPIADA)) {
      for (const n of niveis) {
        expect(NIVEL_LABEL[n], `label do nível ${n} (${origem})`).toBeTruthy();
        expect(NIVEIS_TODOS, `${n} (${origem}) em NIVEIS_TODOS`).toContain(n);
      }
    }
  });

  it("Mandacaru tem os quatro níveis nomeados pela cultura nordestina", () => {
    expect(NIVEIS_POR_OLIMPIADA.mandacaru).toEqual(["cajuina", "luiz_gonzaga", "zumbi", "lampiao"]);
  });

  it("Mandacaru não é fase única — tem duas modalidades", () => {
    expect(OLIMPIADAS_FASE_UNICA).not.toContain("mandacaru");
    expect(FASES_POR_OLIMPIADA.mandacaru).toHaveLength(2);
  });
});
