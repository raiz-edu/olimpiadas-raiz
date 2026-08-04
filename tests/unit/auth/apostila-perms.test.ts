import { describe, expect, it } from "vitest";
import { can, podeGerirApostilas } from "@/lib/auth/roles";
import { APOSTILA_AUTORES } from "@/lib/auth/domains";
import type { RoleUsuario } from "@/lib/types/database";

const HELIO = "helio.barbosa@raizeducacao.com.br";
const OUTRO_ADMIN = "hugo.carvalho@raizeducacao.com.br";

describe("permissões do módulo Apostilas (issue #136)", () => {
  it("raiz tem CRUD de apostila", () => {
    expect(can("raiz", "apostila:create")).toBe(true);
    expect(can("raiz", "apostila:update")).toBe(true);
    expect(can("raiz", "apostila:delete")).toBe(true);
    expect(can("raiz", "apostila:read")).toBe(true);
  });

  it("todas as demais roles staff só leem", () => {
    const roles: RoleUsuario[] = [
      "diretor_marca",
      "gestor_conteudo",
      "professor",
      "coordenador",
      "diretor",
    ];
    for (const role of roles) {
      expect(can(role, "apostila:read")).toBe(true);
      expect(can(role, "apostila:create")).toBe(false);
      expect(can(role, "apostila:delete")).toBe(false);
    }
  });

  it("gerir apostilas exige raiz + e-mail na allowlist (apenas o Helio)", () => {
    expect(podeGerirApostilas("raiz", HELIO)).toBe(true);
    expect(podeGerirApostilas("raiz", HELIO.toUpperCase())).toBe(true);
    expect(podeGerirApostilas("raiz", OUTRO_ADMIN)).toBe(false);
    expect(podeGerirApostilas("gestor_conteudo", HELIO)).toBe(false);
    expect(podeGerirApostilas("raiz", null)).toBe(false);
  });

  it("allowlist contém exatamente os 2 e-mails do Helio", () => {
    expect(APOSTILA_AUTORES.size).toBe(2);
    expect(APOSTILA_AUTORES.has("helio.barbosa@raizeducacao.com.br")).toBe(true);
    expect(APOSTILA_AUTORES.has("helio.barbosa@matrizeducacao.com.br")).toBe(true);
  });
});
