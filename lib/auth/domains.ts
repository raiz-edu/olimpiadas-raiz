export const ALLOWED_DOMAINS = [
  "colegioapogeu.com.br",
  "matrizeducacao.com.br",
  "colegioqi.com.br",
  "colegiouniao.com.br",
  "americanobilingue.com.br",
  "unificado.com.br",
  "raizeducacao.com.br",
] as const;

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

// Únicos emails com role raiz (admin total) — todos os demais recebem professor por padrão
export const ADMIN_EMAILS = new Set([
  "helio.barbosa@matrizeducacao.com.br",
  "helio.barbosa@raizeducacao.com.br",
  "hugo.carvalho@raizeducacao.com.br",
]);

export const ALLOWED_STUDENT_EMAILS = new Set([
  "milena.gallotte@raizeducacao.com.br",
  "bernardo.castro@raizeducacao.com.br",
]);

export const DOMAIN_TO_MARCA_SLUG: Record<string, string | null> = {
  "colegioapogeu.com.br": "apogeu",
  "matrizeducacao.com.br": "matriz-educacao",
  "colegioqi.com.br": "qi-bilingue",
  "colegiouniao.com.br": "uniao",
  "americanobilingue.com.br": "americano",
  "unificado.com.br": "unificado",
  "raizeducacao.com.br": null,
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

export function isAllowedStaffEmail(email: string): boolean {
  const base = matchAllowedBaseDomain(getEmailDomain(email));
  if (!base) return false;

  // raizeducacao.com.br (domínio da rede) e subdomínios são restritos aos admins designados.
  if (base === "raizeducacao.com.br") {
    return ADMIN_EMAILS.has(email.toLowerCase());
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
