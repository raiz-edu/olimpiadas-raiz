import type { RoleUsuario } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Mapa de permissões por role
// Fonte da verdade para o frontend — espelha as RLS policies do backend.
// SPEC §3.3 + ADR-0002
// ---------------------------------------------------------------------------

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
  | "usuario";

export type Action = "create" | "read" | "update" | "delete" | "export";

export type Permission = `${Resource}:${Action}`;

type RolePermissions = Record<RoleUsuario, Set<Permission>>;

function perms(...list: Permission[]): Set<Permission> {
  return new Set(list);
}

export const ROLE_PERMISSIONS: RolePermissions = {
  admin_rede: perms(
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

  coord_marca: perms(
    "marca:read",
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
    "inscricao:create",
    "inscricao:read",
    "inscricao:update",
    "inscricao:delete",
    "inscricao:export",
    "resultado:create",
    "resultado:read",
    "resultado:update",
    "resultado:export",
    "convite:create",
    "convite:read",
    "usuario:read",
  ),

  coord_unidade: perms(
    "marca:read",
    "unidade:read",
    "turma:create",
    "turma:read",
    "turma:update",
    "turma:delete",
    "aluno:create",
    "aluno:read",
    "aluno:update",
    "aluno:delete",
    "olimpiada:read",
    "inscricao:create",
    "inscricao:read",
    "inscricao:update",
    "inscricao:export",
    "resultado:create",
    "resultado:read",
    "resultado:update",
    "resultado:export",
    "convite:create",
    "convite:read",
    "usuario:read",
  ),

  professor: perms(
    "marca:read",
    "unidade:read",
    "turma:read",
    "aluno:create",
    "aluno:read",
    "aluno:update",
    "olimpiada:read",
    "inscricao:create",
    "inscricao:read",
    "resultado:read",
  ),
};

/**
 * Verifica se uma role tem permissão para uma ação em um recurso.
 */
export function can(role: RoleUsuario, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Verifica se uma role tem TODAS as permissões listadas.
 */
export function canAll(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/**
 * Verifica se uma role tem PELO MENOS UMA das permissões listadas.
 */
export function canAny(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

// ---------------------------------------------------------------------------
// Labels amigáveis para exibição
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<RoleUsuario, string> = {
  admin_rede: "Administrador da Rede",
  coord_marca: "Coordenador de Marca",
  coord_unidade: "Coordenador de Unidade",
  professor: "Professor",
};

export const ROLE_DESCRIPTIONS: Record<RoleUsuario, string> = {
  admin_rede: "Acesso total a todas as marcas e funcionalidades",
  coord_marca: "Gerencia unidades, turmas e olimpíadas da sua marca",
  coord_unidade: "Gerencia turmas e alunos da sua unidade",
  professor: "Inscreve alunos e acompanha resultados das suas turmas",
};
