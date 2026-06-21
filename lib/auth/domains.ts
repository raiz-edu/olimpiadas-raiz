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
  "hugo.carvalho@raizeducacao.com.br",
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

export function isAllowedDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!(ALLOWED_DOMAINS as readonly string[]).includes(domain)) return false;

  // raizeducacao.com.br (domínio da rede) é restrito aos admins designados, por enquanto.
  if (domain === "raizeducacao.com.br") {
    return ADMIN_EMAILS.has(email.toLowerCase());
  }

  return true;
}

export function getRoleForEmail(email: string): "raiz" | "professor" {
  return ADMIN_EMAILS.has(email.toLowerCase()) ? "raiz" : "professor";
}
