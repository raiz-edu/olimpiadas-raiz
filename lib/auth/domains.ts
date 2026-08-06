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
  // Lote CONVIDADOS RT (2026-08-06): Global Tree, APG Governo e Sarah Dawsey.
  "crecheglobaltree.com.br",
  "apggov.com.br",
  "sarahdawsey.com.br",
  "raizeducacao.com.br",
] as const;

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

// Únicos emails com role raiz (admin total) — todos os demais recebem professor por
// padrão. Restrito a Helio e Hugo em 2026-08-05 (decisão do Helio: "apenas eu e Hugo
// devem ser os admins"). Os demais entram como Professor (leitura).
export const ADMIN_EMAILS = new Set([
  "helio.barbosa@matrizeducacao.com.br",
  "helio.barbosa@raizeducacao.com.br",
  "hugo.carvalho@raizeducacao.com.br",
]);

// NOTA (2026-08-06): a lista STAFF_LEITOR_EMAILS deixou de existir. Ela só era
// necessária enquanto o domínio da rede era fechado à allowlist de admins; agora
// todo e-mail institucional entra no portal staff (ver podeEntrarNoPortalStaff),
// sempre com papel de leitura — só ADMIN_EMAILS recebe papel de administração.

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
  "crecheglobaltree.com.br": "global-tree",
  "apggov.com.br": "apogeu", // APG Governo é área do Apogeu, não escola própria
  "sarahdawsey.com.br": "sarah-dawsey",
  "raizeducacao.com.br": "raiz-educacao", // equipe da rede
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
 * Pode entrar no portal STAFF pelo Google (decisão do Helio 2026-08-06): todo
 * e-mail institucional entra, e é criado como Professor — papel de leitura, ver
 * lib/auth/roles.ts. O convite com senha continua valendo para quem não tem
 * conta Google no domínio.
 */
export function podeEntrarNoPortalStaff(email: string): boolean {
  return isAllowedStaffEmail(email);
}

/**
 * Exceções NOMINAIS: e-mails fora dos domínios institucionais liberados um a um,
 * enquanto a pessoa não tem endereço da rede. É deliberadamente por e-mail, e não
 * por domínio: liberar "gmail.com" abriria o sistema para qualquer conta.
 *
 * TEMPORÁRIO — remover cada linha assim que o e-mail institucional existir.
 *   franco.natasha@gmail.com — Natasha Franco (Raiz), incluída em 2026-08-06.
 */
export const EMAILS_EXCECAO = new Set(["franco.natasha@gmail.com"]);

export function isAllowedStaffEmail(email: string): boolean {
  const e = email.toLowerCase();
  if (EMAILS_EXCECAO.has(e)) return true;
  return matchAllowedBaseDomain(getEmailDomain(e)) !== null;
}

export function isAllowedStudentEmail(email: string): boolean {
  // Mesma regra do staff: domínio institucional (ou exceção nominal) entra. A
  // equipe da rede precisa acessar a Plataforma Olímpica para ver o que o aluno vê.
  return isAllowedStaffEmail(email);
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
