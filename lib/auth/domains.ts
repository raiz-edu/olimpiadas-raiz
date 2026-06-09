export const ALLOWED_DOMAINS = [
  "apogeu.com.br",
  "matrizeducacao.com.br",
  "colegioqi.com.br",
  "colegiouniao.com.br",
  "americanobilingue.com.br",
  "unificado.com.br",
  "raiz.com.br",
] as const;

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

export const DOMAIN_TO_MARCA_SLUG: Record<string, string | null> = {
  "apogeu.com.br": "apogeu",
  "matrizeducacao.com.br": "matriz-educacao",
  "colegioqi.com.br": "qi-bilingue",
  "colegiouniao.com.br": "uniao",
  "americanobilingue.com.br": "americano",
  "unificado.com.br": "unificado",
  "raiz.com.br": null,
};

export const DOMAIN_TO_ROLE: Record<string, "admin_rede" | "professor"> = {
  "raiz.com.br": "admin_rede",
  "apogeu.com.br": "professor",
  "matrizeducacao.com.br": "professor",
  "colegioqi.com.br": "professor",
  "colegiouniao.com.br": "professor",
  "americanobilingue.com.br": "professor",
  "unificado.com.br": "professor",
};

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function isAllowedDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain);
}
