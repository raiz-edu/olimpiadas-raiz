// Identidade visual das marcas — fonte ÚNICA de nome e logo por slug.
//
// Antes este mapa estava duplicado em 4 arquivos (login do staff, login do aluno,
// header do sistema e header do aluno): adicionar uma marca exigia lembrar dos
// quatro, e esquecer um deixava a escola sem logo só naquela tela.
//
// Marca sem arquivo de logo (`logo: null`) cai no fallback da Raiz, mas mantém o
// NOME correto — é o estado das escolas integradas até os PNGs serem entregues.

export type IdentidadeMarca = {
  nome: string;
  /** Nome do arquivo em /public/marcas (sem extensão). null = ainda sem logo. */
  logo: string | null;
  /** Ajuste fino de altura na tela de login (algumas logos são mais altas). */
  classeLogin?: string;
  /** Ajuste fino no header do sistema. */
  classeHeaderSistema?: string;
};

export const MARCAS: Record<string, IdentidadeMarca> = {
  americano: { nome: "Americano", logo: "americano" },
  apogeu: {
    nome: "Apogeu",
    logo: "apogeu",
    classeHeaderSistema: "max-h-[77px] max-w-[224px]",
  },
  "matriz-educacao": {
    nome: "Matriz Educação",
    logo: "matriz",
    classeHeaderSistema: "max-h-[77px] max-w-[224px]",
  },
  "qi-bilingue": {
    nome: "QI Bilíngue",
    logo: "qi",
    classeHeaderSistema: "max-h-[77px] max-w-[224px]",
  },
  uniao: {
    nome: "União",
    logo: "uniao",
    classeLogin: "max-h-32",
    classeHeaderSistema: "max-h-12 max-w-[200px]",
  },
  unificado: { nome: "Unificado", logo: "unificado" },
  // Escolas Integradas Raiz (domínios liberados em 2026-08-06, PR #145).
  // Assim que os PNGs entrarem em /public/marcas, trocar `logo: null` pelo arquivo.
  "sa-pereira": { nome: "Sá Pereira", logo: null },
  "escola-sap": { nome: "Escola SAP", logo: null },
  "cubo-global": { nome: "Cubo Global", logo: null },
  "colegio-leonardo-da-vinci": { nome: "Colégio Leonardo da Vinci", logo: null },
};

export const LOGO_RAIZ = "/logo-raiz.png";
export const NOME_RAIZ = "Raiz Educação";

/**
 * Nome do arquivo da logo (sem extensão) para uso no SERVIDOR, onde o PNG é lido
 * do disco em `public/marcas` — geradores de DOCX do calendário e das olimpíadas.
 * Retorna null quando a marca ainda não tem logo própria.
 */
export function arquivoLogoDaMarca(slug: string | null | undefined): string | null {
  return (slug && MARCAS[slug]?.logo) || null;
}

/** Identidade de um slug, com fallback da rede quando o slug é nulo/desconhecido. */
export function identidadeDaMarca(slug: string | null | undefined): {
  nome: string;
  src: string;
  temLogoPropria: boolean;
  classeLogin: string;
  classeHeaderSistema: string;
} {
  const m = slug ? MARCAS[slug] : undefined;
  return {
    nome: m?.nome ?? NOME_RAIZ,
    src: m?.logo ? `/marcas/${m.logo}.png` : LOGO_RAIZ,
    temLogoPropria: !!m?.logo,
    classeLogin: m?.classeLogin ?? "max-h-40",
    classeHeaderSistema: m?.classeHeaderSistema ?? "max-h-16 max-w-[200px]",
  };
}
