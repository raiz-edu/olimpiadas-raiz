/**
 * Testes unitários — lib/auth/roles.ts
 * Valida o mapa de permissões do frontend e helpers can/canAll/canAny.
 */

import { describe, it, expect } from "vitest";
import { can, canAll, canAny, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import type { RoleUsuario } from "@/lib/types/database";

describe("can()", () => {
  it("admin_rede pode tudo em olimpiadas", () => {
    expect(can("admin_rede", "olimpiada:create")).toBe(true);
    expect(can("admin_rede", "olimpiada:delete")).toBe(true);
    expect(can("admin_rede", "audit_log:read")).toBe(true);
  });

  it("professor não pode deletar inscrição", () => {
    expect(can("professor", "inscricao:delete")).toBe(false);
  });

  it("professor pode criar inscrição", () => {
    expect(can("professor", "inscricao:create")).toBe(true);
  });

  it("coord_unidade não pode criar olimpíadas", () => {
    expect(can("coord_unidade", "olimpiada:create")).toBe(false);
  });

  it("coord_marca pode criar olimpíadas mas não deletar", () => {
    expect(can("coord_marca", "olimpiada:create")).toBe(true);
    expect(can("coord_marca", "olimpiada:delete")).toBe(false);
  });

  it("nenhuma role além de admin_rede lê audit_log", () => {
    const roles: RoleUsuario[] = ["coord_marca", "coord_unidade", "professor"];
    for (const role of roles) {
      expect(can(role, "audit_log:read")).toBe(false);
    }
  });
});

describe("canAll()", () => {
  it("retorna true quando todas as permissões são satisfeitas", () => {
    expect(canAll("admin_rede", ["olimpiada:create", "olimpiada:delete"])).toBe(true);
  });

  it("retorna false quando ao menos uma permissão falta", () => {
    expect(canAll("coord_marca", ["olimpiada:create", "olimpiada:delete"])).toBe(false);
  });

  it("retorna true para lista vazia", () => {
    expect(canAll("professor", [])).toBe(true);
  });
});

describe("canAny()", () => {
  it("retorna true quando pelo menos uma permissão é satisfeita", () => {
    expect(canAny("professor", ["olimpiada:create", "olimpiada:read"])).toBe(true);
  });

  it("retorna false quando nenhuma permissão é satisfeita", () => {
    expect(canAny("professor", ["audit_log:read", "olimpiada:delete"])).toBe(false);
  });
});

describe("ROLE_LABELS", () => {
  it("tem label para todas as roles", () => {
    const roles: RoleUsuario[] = ["admin_rede", "coord_marca", "coord_unidade", "professor"];
    for (const role of roles) {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(typeof ROLE_LABELS[role]).toBe("string");
    }
  });
});

describe("ROLE_PERMISSIONS — invariantes críticos", () => {
  it("admin_rede tem mais permissões que coord_marca", () => {
    const adminPerms = ROLE_PERMISSIONS.admin_rede.size;
    const coordPerms = ROLE_PERMISSIONS.coord_marca.size;
    expect(adminPerms).toBeGreaterThan(coordPerms);
  });

  it("professor tem menos permissões que coord_unidade", () => {
    const profPerms = ROLE_PERMISSIONS.professor.size;
    const coordPerms = ROLE_PERMISSIONS.coord_unidade.size;
    expect(profPerms).toBeLessThan(coordPerms);
  });

  it("nenhuma role tem permissão inexistente de convite:export", () => {
    const roles: RoleUsuario[] = ["admin_rede", "coord_marca", "coord_unidade", "professor"];
    for (const role of roles) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((ROLE_PERMISSIONS[role] as Set<any>).has("convite:export")).toBe(false);
    }
  });
});
