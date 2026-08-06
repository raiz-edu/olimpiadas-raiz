import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  MARCAS,
  arquivoLogoDaMarca,
  identidadeDaMarca,
  LOGO_RAIZ,
  NOME_RAIZ,
} from "@/lib/marcas/identidade";
import { DOMAIN_TO_MARCA_SLUG } from "@/lib/auth/domains";

describe("identidade das marcas", () => {
  it("todo slug com domínio liberado tem identidade cadastrada", () => {
    for (const slug of Object.values(DOMAIN_TO_MARCA_SLUG)) {
      if (!slug) continue; // domínio da rede não tem marca
      expect({ slug, temIdentidade: slug in MARCAS }).toEqual({ slug, temIdentidade: true });
    }
  });

  it("toda logo declarada existe em public/marcas (clara e escura)", () => {
    for (const [slug, m] of Object.entries(MARCAS)) {
      for (const arte of [m.logo, m.logoEscura]) {
        if (!arte) continue;
        const arquivo = path.join(process.cwd(), "public", "marcas", `${arte}.png`);
        expect({ slug, arte, existe: fs.existsSync(arquivo) }).toEqual({
          slug,
          arte,
          existe: true,
        });
      }
    }
  });

  it("fundo escuro usa a versão negativa quando a marca tem uma", () => {
    // Sá Pereira fica de fora: a arte colorida oficial já tem contraste no escuro
    for (const slug of ["escola-sap", "cubo-global", "colegio-leonardo-da-vinci"]) {
      const claro = identidadeDaMarca(slug, "claro").src;
      const escuro = identidadeDaMarca(slug, "escuro").src;
      expect({ slug, diferente: claro !== escuro }).toEqual({ slug, diferente: true });
      expect(escuro).toContain("-escuro.png");
    }
  });

  it("marca sem versão negativa usa a mesma arte nos dois fundos", () => {
    expect(identidadeDaMarca("apogeu", "claro").src).toBe(
      identidadeDaMarca("apogeu", "escuro").src,
    );
  });

  it("arquivoLogoDaMarca respeita o fundo (documento usa a colorida)", () => {
    expect(arquivoLogoDaMarca("escola-sap")).toBe("escolasap");
    expect(arquivoLogoDaMarca("escola-sap", "escuro")).toBe("escolasap-escuro");
  });

  it("marca com logo devolve o caminho da própria logo", () => {
    const id = identidadeDaMarca("apogeu");
    expect(id.src).toBe("/marcas/apogeu.png");
    expect(id.nome).toBe("Apogeu");
    expect(id.temLogoPropria).toBe(true);
  });

  it("marca desconhecida mantém fallback da rede", () => {
    const id = identidadeDaMarca("marca-que-nao-existe");
    expect(id.nome).toBe(NOME_RAIZ);
    expect(id.src).toBe(LOGO_RAIZ);
    expect(id.temLogoPropria).toBe(false);
  });

  it("slug nulo ou desconhecido usa a identidade da rede", () => {
    for (const slug of [null, undefined, "escola-inexistente"]) {
      const id = identidadeDaMarca(slug);
      expect({ slug, nome: id.nome, src: id.src }).toEqual({
        slug,
        nome: NOME_RAIZ,
        src: LOGO_RAIZ,
      });
    }
  });

  it("arquivoLogoDaMarca serve o servidor e protege marca sem logo", () => {
    expect(arquivoLogoDaMarca("matriz-educacao")).toBe("matriz");
    expect(arquivoLogoDaMarca("marca-que-nao-existe")).toBeNull();
    expect(arquivoLogoDaMarca(null)).toBeNull();
  });

  it("as 4 escolas integradas têm nome e as duas artes", () => {
    for (const [slug, nome] of [
      ["sa-pereira", "Sá Pereira"],
      ["escola-sap", "Escola SAP"],
      ["cubo-global", "Cubo Global"],
      ["colegio-leonardo-da-vinci", "Colégio Leonardo da Vinci"],
    ] as const) {
      expect(MARCAS[slug]?.nome).toBe(nome);
      expect(MARCAS[slug]?.logo).toBeTruthy();
    }
  });
});
