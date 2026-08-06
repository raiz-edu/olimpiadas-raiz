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

  it("toda logo declarada existe em public/marcas", () => {
    for (const [slug, m] of Object.entries(MARCAS)) {
      if (!m.logo) continue;
      const arquivo = path.join(process.cwd(), "public", "marcas", `${m.logo}.png`);
      expect({ slug, existe: fs.existsSync(arquivo) }).toEqual({ slug, existe: true });
    }
  });

  it("marca com logo devolve o caminho da própria logo", () => {
    const id = identidadeDaMarca("apogeu");
    expect(id.src).toBe("/marcas/apogeu.png");
    expect(id.nome).toBe("Apogeu");
    expect(id.temLogoPropria).toBe(true);
  });

  it("marca sem logo mantém o nome e cai no fallback da rede", () => {
    const id = identidadeDaMarca("sa-pereira");
    expect(id.nome).toBe("Sá Pereira");
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
    expect(arquivoLogoDaMarca("cubo-global")).toBeNull();
    expect(arquivoLogoDaMarca(null)).toBeNull();
  });

  it("as 4 escolas integradas já têm nome cadastrado", () => {
    for (const [slug, nome] of [
      ["sa-pereira", "Sá Pereira"],
      ["escola-sap", "Escola SAP"],
      ["cubo-global", "Cubo Global"],
      ["colegio-leonardo-da-vinci", "Colégio Leonardo da Vinci"],
    ] as const) {
      expect(MARCAS[slug]?.nome).toBe(nome);
    }
  });
});
