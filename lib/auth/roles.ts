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
  | "questao"
  | "simulado"
  | "projeto";

export type Action = "create" | "read" | "update" | "delete" | "export";

export type Permission = `${Resource}:${Action}`;

type RolePermissions = Partial<Record<RoleUsuario, Set<Permission>>>;

function perms(...list: Permission[]): Set<Permission> {
  return new Set(list);
}

// ─── Conjunto base de leitura geral ──────────────────────────────────────────

const LEITURA_GERAL = perms(
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
  "questao:read",
  "simulado:read",
  "projeto:read",
  // usuario:read e convite:read NÃO estão aqui — seção Usuários só para raiz e diretor_marca
);

// ─── Matriz de permissões ─────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: RolePermissions = {
  // Flag interno dos 2 admins do sistema (Helio e Hugo) — acesso total
  raiz: perms(
    "questao:create",
    "questao:read",
    "questao:update",
    "questao:delete",
    "simulado:create",
    "simulado:read",
    "simulado:update",
    "simulado:delete",
    "projeto:create",
    "projeto:read",
    "projeto:update",
    "projeto:delete",
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

  // Vê Gestão e Usuários, gerencia usuários da sua marca, leitura geral
  diretor_marca: perms(
    ...LEITURA_GERAL,
    "audit_log:read",
    "convite:create",
    "convite:delete",
    "usuario:create",
    "usuario:update",
  ),

  // Cria e edita banco de questões, simulados e projetos; leitura geral; sem Gestão/Usuários
  gestor_conteudo: perms(
    ...LEITURA_GERAL,
    "questao:create",
    "questao:update",
    "simulado:create",
    "simulado:update",
    "projeto:create",
    "projeto:update",
  ),

  // Leitura geral — sem escrita, sem Gestão, sem Usuários
  professor: perms(...LEITURA_GERAL),
  coordenador: perms(...LEITURA_GERAL),
  diretor: perms(...LEITURA_GERAL),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function can(role: RoleUsuario, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function canUser(
  user: { role: RoleUsuario; admin_marca: boolean },
  permission: Permission,
): boolean {
  return can(user.role, permission);
}

export function canAll(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

export function canAny(role: RoleUsuario, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

// ─── Labels e descrições ──────────────────────────────────────────────────────

export const ROLE_LABELS: Partial<Record<RoleUsuario, string>> = {
  diretor_marca: "Diretor de Marca",
  gestor_conteudo: "Gestor de Conteúdo",
  professor: "Professor",
  coordenador: "Coordenador",
  diretor: "Diretor",
};

export const ROLE_DESCRIPTIONS: Partial<Record<RoleUsuario, string>> = {
  diretor_marca: "Visão de Gestão e Usuários — gerencia usuários da marca",
  gestor_conteudo: "Cria e edita banco de questões, simulados e projetos",
  professor: "Leitura geral — sem acesso a Gestão ou Usuários",
  coordenador: "Leitura geral — sem acesso a Gestão ou Usuários",
  diretor: "Leitura geral — sem acesso a Gestão ou Usuários",
};

// Roles atribuíveis via interface
export const ROLES_ATRIBUIVEIS: RoleUsuario[] = [
  "diretor_marca",
  "gestor_conteudo",
  "professor",
  "coordenador",
  "diretor",
];
