import { describe, expect, it } from "vitest";
import {
  isAllowedStaffEmail,
  isAllowedStudentEmail,
  getMarcaSlugForEmail,
  getRoleForEmail,
  podeEntrarNoPortalStaff,
  ADMIN_EMAILS,
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
});
