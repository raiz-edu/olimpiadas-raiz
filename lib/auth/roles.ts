import type { RoleUsuario } from "@/lib/types/database";

export type Resource =
  | "marca"
  | "unidade"
  | "turma"
  | "aluno"
  | "olimpiada"
  | "inscricao"
  | "resultado"
  | "audit_log"
  | "convite"
  | "usuario"
  | "questao";

export type Action = "create" | "read" | "update" | "delete" | "export";

export type Permission = `${Resource}:${Action}`;

type RolePermissions = Record<RoleUsuario, Set<Permission>>;

function perms(...list: Permission[]): Set<Permission> {
  return new Set(list);
}

// Permissões de leitura — compartilhadas pelos 3 roles de nível 2
const READ_ONLY = perms(
  "marca:read",
  "unidade:read",
  "turma:read",
  "aluno:read",
  "aluno:export",
  "olimpiada:read",
  "inscricao:read",
  "inscricao:export",
  "resultado:read",
  "resultado:export",
  "audit_log:read",
  "usuario:read",
  "convite:read",
);

// Permissões adicionais concedidas pelo flag admin_marca (acumulativo)
export const ADMIN_MARCA_EXTRA = perms(
  "convite:create",
  "convite:delete",
  "usuario:create",
  "usuario:update",
);

export const ROLE_PERMISSIONS: RolePermissions = {
  raiz: perms(
    "questao:create",
    "questao:read",
    "questao:update",
    "questao:delete",
    "marca:create",
    "marca:read",
    "marca:update",
    "marca:delete",
    "unidade:create",
    "unidade:read",
    "unidade:update",
    "unidade:delete",
    "turma:create",
    "turma:read",
    "turma:update",
    "turma:delete",
    "aluno:create",
    "aluno:read",
    "aluno:update",
    "aluno:delete",
    "aluno:export",
    "olimpiada:create",
    "olimpiada:read",
    "olimpiada:update",
    "olimpiada:delete",
    "inscricao:create",
    "inscricao:read",
    "inscricao:update",
    "inscricao:delete",
    "inscricao:export",
    "resultado:create",
    "resultado:read",
    "resultado:update",
    "resultado:delete",
    "resultado:export",
    "audit_log:read",
    "convite:create",
    "convite:read",
    "convite:delete",
    "usuario:create",
    "usuario:read",
    "usuario:update",
    "usuario:delete",
  ),
  direcao_marca: READ_ONLY,
  direcao_unidade: READ_ONLY,
  coordenacao_unidade: READ_ONLY,
};

export function can(role: RoleUsuario, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Verifica permissão considerando também o flag admin_marca.
 * Preferir este em Server Components que têm acesso ao objeto user.
 */
export function canUser(
  user: { role: RoleUsuario; admin_marca: boolean },
  permission: Permission,
): boolean {
  if (can(user.role, permission)) return true;
  if (user.admin_marca && ADMIN_MARCA_EXTRA.has(permission)) return true;
  return false;
}

export function canAll(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

export function canAny(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export const ROLE_LABELS: Record<RoleUsuario, string> = {
  raiz: "Raiz",
  direcao_marca: "Direção de Marca",
  direcao_unidade: "Direção de Unidade",
  coordenacao_unidade: "Coordenação de Unidade",
};

export const ROLE_DESCRIPTIONS: Record<RoleUsuario, string> = {
  raiz: "Acesso total — leitura e escrita em todas as áreas",
  direcao_marca: "Somente leitura — visão consolidada da marca",
  direcao_unidade: "Somente leitura — visão consolidada da unidade",
  coordenacao_unidade: "Somente leitura — visão consolidada da unidade",
};
