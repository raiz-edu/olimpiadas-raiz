import type { Aluno } from "@/lib/types/database";

export type TipoPerfilPortal = "aluno" | "professor" | "colaborador";
export const PERFIS_PORTAL = {
  aluno: { titulo: "Sou aluno", descricao: "Minha escola, meus estudos e minha evolução." },
  professor: { titulo: "Sou professor", descricao: "Conhecer os conteúdos e apoiar os alunos." },
  colaborador: {
    titulo: "Outro profissional",
    descricao: "Explorar a plataforma e acompanhar o projeto.",
  },
} as const;
// Mesmos valores usados na seleção de séries dos simulados.
export const SERIES_CADASTRO = [
  ...Array.from({ length: 9 }, (_, i) => ({
    valor: `${i + 1}º`,
    nome: `${i + 1}º ano — Fundamental`,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    valor: `${i + 1}º EM`,
    nome: `${i + 1}ª série — Ensino Médio`,
  })),
];
type Perfil = Pick<
  Aluno,
  | "tipo_usuario"
  | "cadastro_concluido_em"
  | "unidade_id"
  | "marca_id"
  | "serie"
  | "consentimento_responsavel"
> &
  Partial<Pick<Aluno, "serie_cadastro">>;

export function isTipoPerfilPortal(tipo: unknown): tipo is TipoPerfilPortal {
  return tipo === "aluno" || tipo === "professor" || tipo === "colaborador";
}
export function alunoIdentificado(
  aluno: Pick<Aluno, "tipo_usuario" | "turma_id" | "ra_totvs" | "email">,
): boolean {
  if (aluno.tipo_usuario === "aluno" || aluno.turma_id || aluno.ra_totvs?.trim()) return true;
  const [nome = "", dominio = ""] = (aluno.email ?? "").toLowerCase().split("@");
  return (
    dominio.startsWith("alunos.") ||
    (["matrizeducacao.com.br", "colegioqi.com.br"].includes(dominio) &&
      /^[a-z][a-z0-9._-]*(qi|me|mt)[0-9]{8}$/.test(nome))
  );
}
export function cadastroPortalConcluido(aluno: Perfil): boolean {
  return Boolean(
    aluno.cadastro_concluido_em &&
    isTipoPerfilPortal(aluno.tipo_usuario) &&
    (aluno.tipo_usuario !== "aluno" ||
      (aluno.marca_id &&
        aluno.unidade_id &&
        (aluno.serie?.trim() || aluno.serie_cadastro?.trim()))),
  );
}
export function destinoPortal(aluno: Perfil, popup = false): string {
  if (!cadastroPortalConcluido(aluno)) return `/aluno/cadastro${popup ? "?popup=1" : ""}`;
  if (aluno.tipo_usuario === "aluno" && !aluno.consentimento_responsavel)
    return `/aluno/login?consentimento=1${popup ? "&popup=1" : ""}`;
  return popup ? "/auth/popup-callback" : "/aluno/dashboard";
}
export function podeEstudarNoPortal(aluno: Perfil): boolean {
  return destinoPortal(aluno) === "/aluno/dashboard";
}
/** NULL é legado ainda não classificado; pendente novo não compõe o denominador. */
export function compoeIndicadoresAluno(tipo: Aluno["tipo_usuario"] | undefined): boolean {
  return tipo == null || tipo === "aluno";
}
