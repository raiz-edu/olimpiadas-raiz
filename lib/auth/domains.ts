// Domínios institucionais com acesso ao sistema e à plataforma do aluno. Subdomínios
// entram junto (ex.: alunos.colegioapogeu.com.br) via matchAllowedBaseDomain.
// Escolas Integradas Raiz adicionadas em 2026-08-06: Sá Pereira, Escola SAP,
// Cubo Global e Colégio Leonardo da Vinci.
export const ALLOWED_DOMAINS = [
  "colegioapogeu.com.br",
  "matrizeducacao.com.br",
  "colegioqi.com.br",
  "colegiouniao.com.br",
  "americanobilingue.com.br",
  "unificado.com.br",
  "sapereira.com.br",
  "escolasap.com.br",
  "cubo.global", // sem .com.br de propósito — o TLD é .global
  "colegioleonardodavinci.com.br",
  "raizeducacao.com.br",
] as const;

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

// Únicos emails com role raiz (admin total) — todos os demais recebem professor por
// padrão. Restrito a Helio e Hugo em 2026-08-05 (decisão do Helio: "apenas eu e Hugo
// devem ser os admins"). Bernardo e Milena passaram a STAFF_LEITOR_EMAILS.
export const ADMIN_EMAILS = new Set([
  "helio.barbosa@matrizeducacao.com.br",
  "helio.barbosa@raizeducacao.com.br",
  "hugo.carvalho@raizeducacao.com.br",
]);

// Staff da rede SEM poderes de admin: entram no sistema pelo Google e leem tudo, mas
// não criam nada (o papel no banco define as permissões — ver lib/auth/roles.ts).
// Sem esta lista eles perderiam o login, porque o domínio da rede é fechado.
export const STAFF_LEITOR_EMAILS = new Set([
  "bernardo.castro@raizeducacao.com.br",
  "milena.gallotte@raizeducacao.com.br",
]);

export const ALLOWED_STUDENT_EMAILS = new Set([
  "milena.gallotte@raizeducacao.com.br",
  "bernardo.castro@raizeducacao.com.br",
]);

// Únicos e-mails que podem CRIAR/EDITAR/EXCLUIR receitas de apostila (issue #136,
// decisão de 2026-08-04: "apenas o Helio, por enquanto"). A role raiz tem outros
// admins, por isso o gate é por e-mail além da permissão apostila:create.
export const APOSTILA_AUTORES = new Set([
  "helio.barbosa@matrizeducacao.com.br",
  "helio.barbosa@raizeducacao.com.br",
]);

// Slug precisa existir na tabela `marca`, senão o vínculo automático no primeiro
// login não acontece (o usuário entra sem marca e não vê os dados da escola dele).
export const DOMAIN_TO_MARCA_SLUG: Record<string, string | null> = {
  "colegioapogeu.com.br": "apogeu",
  "matrizeducacao.com.br": "matriz-educacao",
  "colegioqi.com.br": "qi-bilingue",
  "colegiouniao.com.br": "uniao",
  "americanobilingue.com.br": "americano",
  "unificado.com.br": "unificado",
  "sapereira.com.br": "sa-pereira",
  "escolasap.com.br": "escola-sap",
  "cubo.global": "cubo-global",
  "colegioleonardodavinci.com.br": "colegio-leonardo-da-vinci",
  "raizeducacao.com.br": null, // domínio da rede: sem marca, restrito à allowlist
};

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

/**
 * Retorna o domínio institucional base ao qual `domain` pertence — ele mesmo
 * ou um subdomínio dele (ex.: "alunos.colegioapogeu.com.br" → "colegioapogeu.com.br").
 * Alunos usam subdomínios (`alunos.<marca>`) separados do staff no Google Workspace.
 * O ponto antes do base evita falso positivo (ex.: "xcolegioapogeu.com.br" não casa).
 */
export function matchAllowedBaseDomain(domain: string): AllowedDomain | null {
  for (const base of ALLOWED_DOMAINS) {
    if (domain === base || domain.endsWith(`.${base}`)) return base;
  }
  return null;
}

/**
 * Pode entrar no portal STAFF pelo Google. Admins e staff-leitores designados; os
 * demais (domínios de marca) entram por e-mail e senha, via convite.
 */
export function podeEntrarNoPortalStaff(email: string): boolean {
  const e = email.toLowerCase();
  return ADMIN_EMAILS.has(e) || STAFF_LEITOR_EMAILS.has(e);
}

export function isAllowedStaffEmail(email: string): boolean {
  const base = matchAllowedBaseDomain(getEmailDomain(email));
  if (!base) return false;

  // raizeducacao.com.br (domínio da rede) e subdomínios são restritos às pessoas
  // designadas: admins (Helio, Hugo) e staff-leitores.
  if (base === "raizeducacao.com.br") {
    return podeEntrarNoPortalStaff(email);
  }

  return true;
}

export function isAllowedStudentEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const base = matchAllowedBaseDomain(getEmailDomain(normalizedEmail));
  if (!base) return false;

  if (base === "raizeducacao.com.br") {
    return ADMIN_EMAILS.has(normalizedEmail) || ALLOWED_STUDENT_EMAILS.has(normalizedEmail);
  }

  return true;
}

export function isAllowedDomain(email: string): boolean {
  return isAllowedStaffEmail(email);
}

/**
 * Slug da marca para um e-mail, resolvendo subdomínios ao domínio base
 * (ex.: aluno em "alunos.colegioapogeu.com.br" → marca "apogeu").
 */
export function getMarcaSlugForEmail(email: string): string | null {
  const base = matchAllowedBaseDomain(getEmailDomain(email));
  return base ? (DOMAIN_TO_MARCA_SLUG[base] ?? null) : null;
}

export function getRoleForEmail(email: string): "raiz" | "professor" {
  return ADMIN_EMAILS.has(email.toLowerCase()) ? "raiz" : "professor";
}
