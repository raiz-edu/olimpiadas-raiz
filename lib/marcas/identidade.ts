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
  /**
   * Versão para FUNDO ESCURO (logins e header do sistema). Marcas cujo nome é
   * escrito em cor escura ficam ilegíveis no fundo #1e293b sem isto. Ausente =
   * a logo padrão serve nos dois fundos.
   */
  logoEscura?: string;
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
  // Logos do Drive _Logotipos, pasta RGB-Digital de cada marca. As quatro têm o
  // nome escrito em cor escura, então todas precisam da versão para fundo escuro.
  "sa-pereira": {
    nome: "Sá Pereira",
    logo: "sapereira",
    // Sem versão negativa de propósito: a arte colorida oficial tem contraste
    // suficiente no escuro (azul 4,6:1 no login e 3,6:1 no header; mínimo 3:1),
    // e a única alternativa do manual é toda branca, que apagaria os bonecos.
    // Logo quase quadrada (AR 1.24): as demais são largas e param no limite de
    // LARGURA do container, enquanto esta para no de ALTURA. Com max-h-32 ela
    // renderizava 20k px² contra 27k-58k das outras; max-h-48 a põe em 46k, na
    // mesma faixa de Apogeu (46k) e União (47k).
    classeLogin: "max-h-48",
    // No header o teto é físico: a barra tem 88px de altura.
    classeHeaderSistema: "max-h-[72px] max-w-[120px]",
  },
  "escola-sap": {
    nome: "Escola SAP",
    logo: "escolasap",
    logoEscura: "escolasap-escuro",
    classeHeaderSistema: "max-h-14 max-w-[200px]",
  },
  // O cinza do wordmark do Cubo tem só 2,7:1 no escuro (apaga), então a versão
  // escura preserva os símbolos coloridos e escreve o nome em branco.
  "cubo-global": { nome: "Cubo Global", logo: "cuboglobal", logoEscura: "cuboglobal-escuro" },
  "colegio-leonardo-da-vinci": {
    nome: "Colégio Leonardo da Vinci",
    logo: "clv",
    logoEscura: "clv-escuro",
    classeHeaderSistema: "max-h-[68px] max-w-[224px]",
  },
  // Lote CONVIDADOS RT (2026-08-06). Logos do Drive _Logotipos.
  "global-tree": {
    nome: "Global Tree",
    logo: "globaltree",
    logoEscura: "globaltree-escuro",
    classeHeaderSistema: "max-h-[72px] max-w-[170px]",
  },
  "sarah-dawsey": {
    nome: "Colégio Sarah Dawsey",
    logo: "sarahdawsey",
    logoEscura: "sarahdawsey-escuro",
  },
  // A rede é a identidade padrão do sistema: sem arte própria de propósito, para
  // cair no bloco da Raiz (logo + "Programa Raiz Olímpica") que o header já monta.
  "raiz-educacao": { nome: "Raiz Educação", logo: null },
};

export const LOGO_RAIZ = "/logo-raiz.png";
export const NOME_RAIZ = "Raiz Educação";

/**
 * Nome do arquivo da logo (sem extensão) para uso no SERVIDOR, onde o PNG é lido
 * do disco em `public/marcas` — geradores de DOCX do calendário e das olimpíadas.
 * Retorna null quando a marca ainda não tem logo própria.
 */
export function arquivoLogoDaMarca(
  slug: string | null | undefined,
  fundo: "claro" | "escuro" = "claro",
): string | null {
  const m = slug ? MARCAS[slug] : undefined;
  return (fundo === "escuro" ? (m?.logoEscura ?? m?.logo) : m?.logo) || null;
}

/**
 * Identidade de um slug, com fallback da rede quando o slug é nulo/desconhecido.
 *
 * `fundo` escolhe a arte: "escuro" (logins e header do sistema, #1e293b) usa a
 * versão negativa quando a marca tem uma; "claro" (header do aluno e documentos)
 * usa sempre a colorida.
 */
export function identidadeDaMarca(
  slug: string | null | undefined,
  fundo: "claro" | "escuro" = "escuro",
): {
  nome: string;
  src: string;
  temLogoPropria: boolean;
  classeLogin: string;
  classeHeaderSistema: string;
} {
  const m = slug ? MARCAS[slug] : undefined;
  const arquivo = fundo === "escuro" ? (m?.logoEscura ?? m?.logo) : m?.logo;
  return {
    nome: m?.nome ?? NOME_RAIZ,
    src: arquivo ? `/marcas/${arquivo}.png` : LOGO_RAIZ,
    temLogoPropria: !!arquivo,
    classeLogin: m?.classeLogin ?? "max-h-40",
    classeHeaderSistema: m?.classeHeaderSistema ?? "max-h-16 max-w-[200px]",
  };
}
