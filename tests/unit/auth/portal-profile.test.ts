import { describe, expect, it } from "vitest";
import {
  alunoIdentificado,
  cadastroPortalConcluido,
  destinoPortal,
  podeEstudarNoPortal,
} from "@/lib/auth/portal-profile";
import type { Aluno } from "@/lib/types/database";

const aluno = {
  tipo_usuario: "aluno",
  cadastro_concluido_em: "2026-10-16T12:00:00Z",
  marca_id: "marca",
  unidade_id: "unidade",
  serie: "6º",
  consentimento_responsavel: true,
  turma_id: null,
  ra_totvs: null,
  email: "pessoa@colegioapogeu.com.br",
} satisfies Partial<Aluno>;

describe("identificação e liberação do perfil de estudo", () => {
  it.each([null, "pendente"] as const)(
    "encaminha perfil %s ao cadastro mesmo com consentimento antigo",
    (tipo_usuario) => {
      expect(destinoPortal({ ...aluno, tipo_usuario })).toBe("/aluno/cadastro");
      expect(podeEstudarNoPortal({ ...aluno, tipo_usuario })).toBe(false);
    },
  );
  it("exige unidade e série do aluno, além da data de conclusão", () => {
    expect(cadastroPortalConcluido({ ...aluno, unidade_id: null })).toBe(false);
    expect(cadastroPortalConcluido({ ...aluno, serie: " " })).toBe(false);
  });
  it("cadastro completo aceita série declarada sem transformar série oficial", () => {
    const perfil = { ...aluno, serie: null, serie_cadastro: "6º" };
    expect(cadastroPortalConcluido(perfil)).toBe(true);
    expect(perfil.serie).toBeNull();
  });
  it("preserva consentimento obrigatório e o fluxo popup", () => {
    expect(destinoPortal({ ...aluno, consentimento_responsavel: false }, true)).toBe(
      "/aluno/login?consentimento=1&popup=1",
    );
    expect(destinoPortal(aluno, true)).toBe("/auth/popup-callback");
    expect(destinoPortal({ ...aluno, cadastro_concluido_em: null }, true)).toBe(
      "/aluno/cadastro?popup=1",
    );
  });
  it.each(["professor", "colaborador"] as const)(
    "libera %s sem responsável, turma, unidade ou série",
    (tipo_usuario) => {
      expect(
        podeEstudarNoPortal({
          ...aluno,
          tipo_usuario,
          unidade_id: null,
          serie: null,
          consentimento_responsavel: false,
        }),
      ).toBe(true);
    },
  );
  it.each([
    { turma_id: "turma" },
    { ra_totvs: "001" },
    { tipo_usuario: "aluno" as const },
    { email: "nome@alunos.colegioapogeu.com.br" },
    { email: "nomeme12345678@matrizeducacao.com.br" },
    { email: "nomeqi12345678@colegioqi.com.br" },
  ])("identifica aluno com vínculo confiável %j", (vinculo) => {
    expect(alunoIdentificado({ ...aluno, tipo_usuario: null, ...vinculo })).toBe(true);
  });
  it("não deduz aluno a partir de domínio escolar comum ou marca corporativa", () => {
    expect(alunoIdentificado({ ...aluno, tipo_usuario: null })).toBe(false);
    expect(
      alunoIdentificado({ ...aluno, tipo_usuario: null, email: "pessoa@raizeducacao.com.br" }),
    ).toBe(false);
  });
});
