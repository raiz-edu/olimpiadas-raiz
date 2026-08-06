import { describe, expect, it } from "vitest";
import {
  isAllowedStaffEmail,
  isAllowedStudentEmail,
  getMarcaSlugForEmail,
  getRoleForEmail,
  podeEntrarNoPortalStaff,
  ADMIN_EMAILS,
  ALLOWED_DOMAINS,
  DOMAIN_TO_MARCA_SLUG,
} from "@/lib/auth/domains";

describe("auth domains", () => {
  it("mantem staff da Raiz restrito as pessoas designadas", () => {
    expect(isAllowedStaffEmail("helio.barbosa@raizeducacao.com.br")).toBe(true);
    // staff-leitores continuam entrando pelo Google, sem serem admins
    expect(isAllowedStaffEmail("bernardo.castro@raizeducacao.com.br")).toBe(true);
    expect(isAllowedStaffEmail("milena.gallotte@raizeducacao.com.br")).toBe(true);
    expect(isAllowedStaffEmail("pessoa.nao.autorizada@raizeducacao.com.br")).toBe(false);
  });

  it("admin e apenas Helio e Hugo (2026-08-05)", () => {
    expect(ADMIN_EMAILS.size).toBe(3); // helio em 2 dominios + hugo
    expect(getRoleForEmail("helio.barbosa@raizeducacao.com.br")).toBe("raiz");
    expect(getRoleForEmail("helio.barbosa@matrizeducacao.com.br")).toBe("raiz");
    expect(getRoleForEmail("hugo.carvalho@raizeducacao.com.br")).toBe("raiz");
    // staff-leitores NAO sao mais admin: entram como papel de leitura
    expect(getRoleForEmail("bernardo.castro@raizeducacao.com.br")).toBe("professor");
    expect(getRoleForEmail("milena.gallotte@raizeducacao.com.br")).toBe("professor");
  });

  it("portal staff pelo Google: admins e staff-leitores; marca entra por senha", () => {
    expect(podeEntrarNoPortalStaff("hugo.carvalho@raizeducacao.com.br")).toBe(true);
    expect(podeEntrarNoPortalStaff("bernardo.castro@raizeducacao.com.br")).toBe(true);
    expect(podeEntrarNoPortalStaff("professor@colegioqi.com.br")).toBe(false);
  });

  it("permite os e-mails liberados no portal do aluno", () => {
    expect(isAllowedStudentEmail("milena.gallotte@raizeducacao.com.br")).toBe(true);
    expect(isAllowedStudentEmail("bernardo.castro@raizeducacao.com.br")).toBe(true);
  });

  it("continua bloqueando e-mails externos no portal do aluno", () => {
    expect(isAllowedStudentEmail("teste@gmail.com")).toBe(false);
  });

  it("resolve marca de subdominio institucional", () => {
    expect(getMarcaSlugForEmail("aluno@alunos.colegioapogeu.com.br")).toBe("apogeu");
  });

  // ─── Escolas Integradas Raiz (2026-08-06) ──────────────────────────────────
  const NOVAS: [dominio: string, slug: string][] = [
    ["sapereira.com.br", "sa-pereira"],
    ["escolasap.com.br", "escola-sap"],
    ["cubo.global", "cubo-global"],
    ["colegioleonardodavinci.com.br", "colegio-leonardo-da-vinci"],
  ];

  it("libera staff e aluno nos dominios das escolas integradas", () => {
    for (const [dominio] of NOVAS) {
      expect({ dominio, staff: isAllowedStaffEmail(`pessoa@${dominio}`) }).toEqual({
        dominio,
        staff: true,
      });
      expect({ dominio, aluno: isAllowedStudentEmail(`aluno@${dominio}`) }).toEqual({
        dominio,
        aluno: true,
      });
    }
  });

  it("libera o subdominio de aluno das escolas integradas", () => {
    for (const [dominio] of NOVAS) {
      expect({ dominio, ok: isAllowedStudentEmail(`aluno@alunos.${dominio}`) }).toEqual({
        dominio,
        ok: true,
      });
    }
  });

  it("vincula cada dominio novo a marca correta", () => {
    for (const [dominio, slug] of NOVAS) {
      expect(getMarcaSlugForEmail(`pessoa@${dominio}`)).toBe(slug);
      expect(getMarcaSlugForEmail(`aluno@alunos.${dominio}`)).toBe(slug);
    }
  });

  it("cubo.global funciona apesar do TLD fora do padrao .com.br", () => {
    expect(isAllowedStaffEmail("pessoa@cubo.global")).toBe(true);
    expect(getMarcaSlugForEmail("pessoa@cubo.global")).toBe("cubo-global");
    // nao pode liberar dominio que apenas TERMINA parecido
    expect(isAllowedStaffEmail("pessoa@naocubo.global")).toBe(false);
    expect(isAllowedStaffEmail("pessoa@cubo.global.com")).toBe(false);
  });

  it("todo dominio liberado tem entrada no mapa de marcas", () => {
    for (const d of ALLOWED_DOMAINS) {
      expect({ d, temEntrada: d in DOMAIN_TO_MARCA_SLUG }).toEqual({ d, temEntrada: true });
    }
  });

  it("segue bloqueando dominio externo", () => {
    expect(isAllowedStaffEmail("pessoa@gmail.com")).toBe(false);
    expect(isAllowedStudentEmail("pessoa@outraescola.com.br")).toBe(false);
  });
});
