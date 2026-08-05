import { describe, expect, it } from "vitest";
import { normalizarDadosUsuario, validarEdicaoUsuario } from "@/lib/usuarios/validacao";

const ctx = { emailsEmUso: ["ocupado@colegioqi.com.br"] };

describe("validarEdicaoUsuario", () => {
  it("aceita nome e e-mail institucional livres", () => {
    expect(
      validarEdicaoUsuario(
        { nome: "Luciana Itho", email: "luciana.itho@raizeducacao.com.br" },
        ctx,
      ),
    ).toEqual([]);
  });

  it("recusa nome curto", () => {
    const erros = validarEdicaoUsuario({ nome: "Lu", email: "lu@colegioqi.com.br" }, ctx);
    expect(erros.some((e) => e.includes("pelo menos 3"))).toBe(true);
  });

  it("recusa nome só com espaços", () => {
    const erros = validarEdicaoUsuario({ nome: "    ", email: "ok@colegioqi.com.br" }, ctx);
    expect(erros.some((e) => e.includes("pelo menos 3"))).toBe(true);
  });

  it("recusa e-mail malformado", () => {
    for (const email of ["semarroba", "a@b", "@colegioqi.com.br", "a b@colegioqi.com.br"]) {
      const erros = validarEdicaoUsuario({ nome: "Nome Certo", email }, ctx);
      expect({ email, invalido: erros.includes("E-mail inválido.") }).toEqual({
        email,
        invalido: true,
      });
    }
  });

  it("recusa domínio não institucional", () => {
    const erros = validarEdicaoUsuario({ nome: "Nome Certo", email: "pessoa@gmail.com" }, ctx);
    expect(erros).toContain("Utilize um e-mail institucional.");
  });

  it("recusa e-mail já usado por outro usuário, ignorando caixa", () => {
    const erros = validarEdicaoUsuario(
      { nome: "Nome Certo", email: "OCUPADO@colegioqi.com.br" },
      ctx,
    );
    expect(erros).toContain("Já existe um usuário com este e-mail.");
  });

  it("aceita e-mail de qualquer marca da rede", () => {
    for (const email of [
      "p@colegioapogeu.com.br",
      "p@matrizeducacao.com.br",
      "p@colegiouniao.com.br",
      "p@americanobilingue.com.br",
      "p@unificado.com.br",
      "p@raizeducacao.com.br",
    ]) {
      expect(validarEdicaoUsuario({ nome: "Nome Certo", email }, ctx)).toEqual([]);
    }
  });
});

describe("normalizarDadosUsuario", () => {
  it("apara o nome e baixa a caixa do e-mail", () => {
    expect(
      normalizarDadosUsuario({ nome: "  Luciana Itho  ", email: "  Luciana.Itho@QI.com.br " }),
    ).toEqual({ nome: "Luciana Itho", email: "luciana.itho@qi.com.br" });
  });
});
