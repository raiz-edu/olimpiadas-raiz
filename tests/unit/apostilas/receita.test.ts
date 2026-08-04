import { describe, expect, it } from "vitest";
import { somaMix, validarReceita, type ReceitaConfig } from "@/lib/apostilas/receita";
import { paresDasSeries, serieKey, SERIE_MAP } from "@/lib/questoes/series";
import { TAXONOMIA_QUESTOES } from "@/lib/questoes/taxonomia";

const base: ReceitaConfig = { titulo: "Apostila de teste" };

describe("validarReceita", () => {
  it("aceita receita mínima (só título)", () => {
    expect(validarReceita(base)).toEqual([]);
  });

  it("exige título", () => {
    expect(validarReceita({ titulo: "  " })).toContain("Título é obrigatório.");
  });

  it("bloqueia mix global que não soma 100", () => {
    const erros = validarReceita({ ...base, mix_dificuldade: { facil: 40, medio: 40 } });
    expect(erros.some((e) => e.includes("somar 100"))).toBe(true);
  });

  it("aceita mix global 40/40/20 com seções quantificadas", () => {
    const erros = validarReceita({
      ...base,
      mix_dificuldade: { facil: 40, medio: 40, dificil: 20 },
      secoes: [{ topico: "Geometria", quantidade: 16 }],
    });
    expect(erros).toEqual([]);
  });

  it("rejeita tópico fora da taxonomia", () => {
    const erros = validarReceita({ ...base, secoes: [{ topico: "Trigonometria" }] });
    expect(erros.some((e) => e.includes("fora da taxonomia"))).toBe(true);
  });

  it("rejeita subtópico que não pertence ao tópico", () => {
    const erros = validarReceita({
      ...base,
      secoes: [{ topico: "Geometria", subtopicos: ["Contagem"] }],
    });
    expect(erros.some((e) => e.includes("não pertence"))).toBe(true);
  });

  it("rejeita quantidade zero ou negativa", () => {
    const erros = validarReceita({ ...base, secoes: [{ topico: "Lógica", quantidade: 0 }] });
    expect(erros.some((e) => e.includes("maior que zero"))).toBe(true);
  });

  it("mix de seção exige quantidade", () => {
    const erros = validarReceita({
      ...base,
      secoes: [{ topico: "Lógica", mix_dificuldade: { facil: 50, medio: 50 } }],
    });
    expect(erros.some((e) => e.includes("exige quantidade"))).toBe(true);
  });

  it("com mix global, seção sem quantidade é bloqueada", () => {
    const erros = validarReceita({
      ...base,
      mix_dificuldade: { facil: 50, medio: 50 },
      secoes: [{ topico: "Geometria" }],
    });
    expect(erros.some((e) => e.includes("toda seção precisa de quantidade"))).toBe(true);
  });
});

describe("somaMix", () => {
  it("soma percentuais ignorando ausentes", () => {
    expect(somaMix({ facil: 40, dificil: 20 })).toBe(60);
    expect(somaMix(undefined)).toBe(0);
  });
});

describe("séries", () => {
  it("normaliza texto livre para a chave canônica", () => {
    expect(serieKey("8º ano")).toBe("8");
    expect(serieKey("2ª série EM")).toBe("2em");
    expect(serieKey("1 em")).toBe("1em");
    expect(serieKey("sem número")).toBeNull();
  });

  it("todo par do SERIE_MAP tem olimpiada e nivel não vazios", () => {
    for (const pares of Object.values(SERIE_MAP)) {
      for (const [olimpiada, nivel] of pares) {
        expect(olimpiada.length).toBeGreaterThan(0);
        expect(nivel.length).toBeGreaterThan(0);
      }
    }
  });

  it("união de séries não duplica pares", () => {
    const pares = paresDasSeries(["1ª série EM", "2ª série EM"]);
    const chaves = pares.map(([o, n]) => `${o}|${n}`);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(chaves).toContain("obmep|nivel_3");
  });
});

describe("consistência com a taxonomia canônica", () => {
  it("taxonomia tem os 7 tópicos esperados", () => {
    expect(Object.keys(TAXONOMIA_QUESTOES)).toHaveLength(7);
  });
});
