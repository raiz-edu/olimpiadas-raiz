import { describe, expect, it } from "vitest";
import {
  isAllowedStaffEmail,
  isAllowedStudentEmail,
  getMarcaSlugForEmail,
} from "@/lib/auth/domains";

describe("auth domains", () => {
  it("mantem staff da Raiz restrito aos admins designados", () => {
    expect(isAllowedStaffEmail("helio.barbosa@raizeducacao.com.br")).toBe(true);
    expect(isAllowedStaffEmail("milena.gallotte@raizeducacao.com.br")).toBe(false);
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
