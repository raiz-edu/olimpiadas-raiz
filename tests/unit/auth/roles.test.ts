/**
 * Testes unitários — lib/auth/roles.ts
 *
 * Modelo de roles (lib/types/database.ts):
 *   raiz              — acesso total
 *   diretor_marca     — leitura geral + Gestão + gerenciar usuários da marca
 *   gestor_conteudo   — criar/editar questão, simulado, projeto + leitura geral
 *   professor         — leitura geral (sem Gestão/Usuários)
 *   coordenador       — leitura geral (sem Gestão/Usuários)
 *   diretor           — leitura geral (sem Gestão/Usuários)
 *   legados           — sem permissões
 */

import { describe, it, expect } from "vitest";
import { can, canAll, canAny, canUser, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import type { RoleUsuario } from "@/lib/types/database";

const LEITURA_ROLES: RoleUsuario[] = ["professor", "coordenador", "diretor"];
const ALL_ROLES: RoleUsuario[] = [
  "raiz",
  "diretor_marca",
  "gestor_conteudo",
  "professor",
  "coordenador",
  "diretor",
];

describe("can() — raiz", () => {
  it("raiz pode fazer tudo", () => {
    expect(can("raiz", "olimpiada:create")).toBe(true);
    expect(can("raiz", "olimpiada:delete")).toBe(true);
    expect(can("raiz", "audit_log:read")).toBe(true);
    expect(can("raiz", "questao:create")).toBe(true);
    expect(can("raiz", "simulado:delete")).toBe(true);
    expect(can("raiz", "usuario:delete")).toBe(true);
  });
});

describe("can() — diretor_marca", () => {
  it("diretor_marca vê Gestão (audit_log:read)", () => {
    expect(can("diretor_marca", "audit_log:read")).toBe(true);
  });

  it("diretor_marca pode gerenciar usuários da marca", () => {
    expect(can("diretor_marca", "convite:create")).toBe(true);
    expect(can("diretor_marca", "usuario:create")).toBe(true);
    expect(can("diretor_marca", "usuario:update")).toBe(true);
  });

  it("diretor_marca NÃO pode deletar usuários (só raiz)", () => {
    expect(can("diretor_marca", "usuario:delete")).toBe(false);
  });

  it("diretor_marca NÃO escreve conteúdo acadêmico", () => {
    expect(can("diretor_marca", "olimpiada:create")).toBe(false);
    expect(can("diretor_marca", "questao:create")).toBe(false);
    expect(can("diretor_marca", "simulado:create")).toBe(false);
    expect(can("diretor_marca", "projeto:create")).toBe(false);
  });

  it("diretor_marca lê tudo", () => {
    expect(can("diretor_marca", "olimpiada:read")).toBe(true);
    expect(can("diretor_marca", "questao:read")).toBe(true);
    expect(can("diretor_marca", "simulado:read")).toBe(true);
    expect(can("diretor_marca", "projeto:read")).toBe(true);
    expect(can("diretor_marca", "aluno:read")).toBe(true);
  });
});

describe("can() — gestor_conteudo", () => {
  it("gestor_conteudo cria e edita questão, simulado, projeto", () => {
    expect(can("gestor_conteudo", "questao:create")).toBe(true);
    expect(can("gestor_conteudo", "questao:update")).toBe(true);
    expect(can("gestor_conteudo", "simulado:create")).toBe(true);
    expect(can("gestor_conteudo", "simulado:update")).toBe(true);
    expect(can("gestor_conteudo", "projeto:create")).toBe(true);
    expect(can("gestor_conteudo", "projeto:update")).toBe(true);
  });

  it("gestor_conteudo NÃO deleta (só raiz)", () => {
    expect(can("gestor_conteudo", "questao:delete")).toBe(false);
    expect(can("gestor_conteudo", "simulado:delete")).toBe(false);
    expect(can("gestor_conteudo", "projeto:delete")).toBe(false);
  });

  it("gestor_conteudo NÃO vê Gestão nem Usuários", () => {
    expect(can("gestor_conteudo", "audit_log:read")).toBe(false);
    expect(can("gestor_conteudo", "convite:create")).toBe(false);
    expect(can("gestor_conteudo", "usuario:create")).toBe(false);
  });

  it("gestor_conteudo NÃO escreve conteúdo administrativo", () => {
    expect(can("gestor_conteudo", "olimpiada:create")).toBe(false);
    expect(can("gestor_conteudo", "inscricao:create")).toBe(false);
    expect(can("gestor_conteudo", "resultado:create")).toBe(false);
  });

  it("gestor_conteudo lê tudo", () => {
    expect(can("gestor_conteudo", "olimpiada:read")).toBe(true);
    expect(can("gestor_conteudo", "inscricao:read")).toBe(true);
    expect(can("gestor_conteudo", "aluno:read")).toBe(true);
  });
});

describe("can() — roles de leitura (professor/coordenador/diretor)", () => {
  it("roles de leitura PODEM ler questão, simulado e projeto", () => {
    for (const role of LEITURA_ROLES) {
      expect(can(role, "questao:read")).toBe(true);
      expect(can(role, "simulado:read")).toBe(true);
      expect(can(role, "projeto:read")).toBe(true);
    }
  });

  it("roles de leitura PODEM ler olimpíadas e inscrições", () => {
    for (const role of LEITURA_ROLES) {
      expect(can(role, "olimpiada:read")).toBe(true);
      expect(can(role, "inscricao:read")).toBe(true);
    }
  });

  it("roles de leitura NÃO criam nem deletam nada", () => {
    for (const role of LEITURA_ROLES) {
      expect(can(role, "olimpiada:create")).toBe(false);
      expect(can(role, "olimpiada:delete")).toBe(false);
      expect(can(role, "questao:create")).toBe(false);
      expect(can(role, "simulado:create")).toBe(false);
      expect(can(role, "projeto:create")).toBe(false);
    }
  });

  it("roles de leitura NÃO veem Gestão nem Usuários", () => {
    for (const role of LEITURA_ROLES) {
      expect(can(role, "audit_log:read")).toBe(false);
      expect(can(role, "convite:create")).toBe(false);
      expect(can(role, "usuario:create")).toBe(false);
    }
  });
});

describe("canUser()", () => {
  it("raiz mantém acesso total independentemente do flag admin_marca", () => {
    const user = { role: "raiz" as RoleUsuario, admin_marca: false };
    expect(canUser(user, "olimpiada:delete")).toBe(true);
    expect(canUser(user, "convite:create")).toBe(true);
  });

  it("gestor_conteudo pode criar questão", () => {
    const user = { role: "gestor_conteudo" as RoleUsuario, admin_marca: false };
    expect(canUser(user, "questao:create")).toBe(true);
    expect(canUser(user, "olimpiada:create")).toBe(false);
  });
});

describe("canAll()", () => {
  it("retorna true quando todas as permissões são satisfeitas", () => {
    expect(canAll("raiz", ["olimpiada:create", "olimpiada:delete"])).toBe(true);
    expect(canAll("gestor_conteudo", ["questao:create", "simulado:update"])).toBe(true);
  });

  it("retorna false quando ao menos uma permissão falta", () => {
    expect(canAll("professor", ["olimpiada:read", "olimpiada:delete"])).toBe(false);
  });

  it("retorna true para lista vazia", () => {
    expect(canAll("coordenador", [])).toBe(true);
  });
});

describe("canAny()", () => {
  it("retorna true quando pelo menos uma permissão é satisfeita", () => {
    expect(canAny("professor", ["olimpiada:create", "olimpiada:read"])).toBe(true);
  });

  it("retorna false quando nenhuma permissão é satisfeita", () => {
    expect(canAny("professor", ["olimpiada:create", "olimpiada:delete"])).toBe(false);
  });
});

describe("ROLE_LABELS", () => {
  it("tem label para todas as roles", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(typeof ROLE_LABELS[role]).toBe("string");
    }
  });
});

describe("ROLE_PERMISSIONS — invariantes críticos", () => {
  it("raiz tem mais permissões que qualquer outro role", () => {
    const raizSize = ROLE_PERMISSIONS.raiz!.size;
    for (const role of ALL_ROLES.filter((r) => r !== "raiz")) {
      expect(raizSize).toBeGreaterThan(ROLE_PERMISSIONS[role]?.size ?? 0);
    }
  });

  it("professor, coordenador e diretor têm o mesmo conjunto de permissões", () => {
    const sizes = LEITURA_ROLES.map((r) => ROLE_PERMISSIONS[r]!.size);
    expect(new Set(sizes).size).toBe(1);
  });

  it("nenhuma role tem a permissão inexistente convite:export", () => {
    for (const role of ALL_ROLES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((ROLE_PERMISSIONS[role] as Set<any> | undefined)?.has("convite:export") ?? false).toBe(
        false,
      );
    }
  });

  it("somente raiz e diretor_marca veem Gestão (audit_log:read)", () => {
    expect(can("raiz", "audit_log:read")).toBe(true);
    expect(can("diretor_marca", "audit_log:read")).toBe(true);
    for (const role of [...LEITURA_ROLES, "gestor_conteudo"] as RoleUsuario[]) {
      expect(can(role, "audit_log:read")).toBe(false);
    }
  });

  it("somente raiz pode deletar questão, simulado e projeto", () => {
    for (const role of ALL_ROLES.filter((r) => r !== "raiz")) {
      expect(can(role, "questao:delete")).toBe(false);
      expect(can(role, "simulado:delete")).toBe(false);
      expect(can(role, "projeto:delete")).toBe(false);
    }
  });

  it("gestor_conteudo e roles leitura podem criar questão vs não podem", () => {
    expect(can("gestor_conteudo", "questao:create")).toBe(true);
    for (const role of LEITURA_ROLES) {
      expect(can(role, "questao:create")).toBe(false);
    }
  });
});
