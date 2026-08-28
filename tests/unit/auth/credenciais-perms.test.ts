import { describe, expect, it } from "vitest";
import { can, podeGerirCredenciais } from "@/lib/auth/roles";
import { ADMIN_EMAILS } from "@/lib/auth/domains";
import type { RoleUsuario } from "@/lib/types/database";

// SPEC issue #159 — CA4
const HELIO_RAIZ = "helio.barbosa@raizeducacao.com.br";
const HELIO_MATRIZ = "helio.barbosa@matrizeducacao.com.br";
const HUGO = "hugo.carvalho@raizeducacao.com.br";

describe("permissões de credenciais (issue #159)", () => {
  it("só raiz tem credencial:read e credencial:update", () => {
    expect(can("raiz", "credencial:read")).toBe(true);
    expect(can("raiz", "credencial:update")).toBe(true);

    const demais: RoleUsuario[] = [
      "diretor_marca",
      "gestor_conteudo",
      "professor",
      "coordenador",
      "diretor",
    ];
    for (const role of demais) {
      expect(can(role, "credencial:read")).toBe(false);
      expect(can(role, "credencial:update")).toBe(false);
    }
  });

  it("gerir credenciais exige raiz + e-mail em ADMIN_EMAILS (Helio e Hugo), sem distinguir caixa", () => {
    expect(podeGerirCredenciais("raiz", HELIO_RAIZ)).toBe(true);
    expect(podeGerirCredenciais("raiz", HELIO_MATRIZ)).toBe(true);
    expect(podeGerirCredenciais("raiz", HUGO)).toBe(true);
    expect(podeGerirCredenciais("raiz", HUGO.toUpperCase())).toBe(true);

    expect(podeGerirCredenciais("raiz", "outro.admin@raizeducacao.com.br")).toBe(false);
    expect(podeGerirCredenciais("diretor_marca", HELIO_RAIZ)).toBe(false);
    expect(podeGerirCredenciais("professor", HUGO)).toBe(false);
    expect(podeGerirCredenciais("raiz", null)).toBe(false);
    expect(podeGerirCredenciais("raiz", "")).toBe(false);
  });

  it("ADMIN_EMAILS contém exatamente os 3 e-mails (2 do Helio, 1 do Hugo)", () => {
    expect(ADMIN_EMAILS.size).toBe(3);
    expect(ADMIN_EMAILS.has(HELIO_RAIZ)).toBe(true);
    expect(ADMIN_EMAILS.has(HELIO_MATRIZ)).toBe(true);
    expect(ADMIN_EMAILS.has(HUGO)).toBe(true);
  });
});
