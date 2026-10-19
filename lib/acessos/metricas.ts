export const PERFIS_ACESSO = {
  aluno: "Alunos",
  professor: "Professores",
  colaborador: "Outros profissionais",
  equipe: "Equipe de gestão",
  pendente: "Perfil pendente",
} as const;

export const PERIODOS_ACESSO = {
  "7": "Últimos 7 dias",
  "30": "Últimos 30 dias",
  "90": "Últimos 90 dias",
  todos: "Todo o histórico",
} as const;
export type PerfilAcesso = keyof typeof PERFIS_ACESSO;
export type PeriodoAcesso = keyof typeof PERIODOS_ACESSO;
export type PessoaAcesso = {
  pessoa_id: string;
  tipo_usuario: PerfilAcesso;
  marca_id: string | null;
  unidade_id: string | null;
  serie: string | null;
  criado_em: string;
  ultimo_acesso: string | null;
  sessoes: number | string;
  acessou_periodo: boolean;
  estudou_periodo: boolean;
  medicao_desde: string | null;
};
export type MarcaAcesso = { id: string; nome: string };
export type UnidadeAcesso = MarcaAcesso & { marca_id: string };
export type FiltrosAcesso = {
  marca: string;
  unidade: string;
  perfil: PerfilAcesso | "";
  serie: string;
  periodo: PeriodoAcesso;
};
export type ParamsAcesso = Record<string, string | string[] | undefined>;
const DIA = 86_400_000;

export function lerFiltrosAcesso(params: ParamsAcesso): FiltrosAcesso {
  const texto = (chave: string) => (typeof params[chave] === "string" ? params[chave] : "");
  const perfil = texto("perfil");
  const periodo = texto("periodo");
  return {
    marca: texto("marca"),
    unidade: texto("unidade"),
    perfil: Object.hasOwn(PERFIS_ACESSO, perfil) ? (perfil as PerfilAcesso) : "",
    serie: !perfil || perfil === "aluno" ? texto("serie") : "",
    periodo: Object.hasOwn(PERIODOS_ACESSO, periodo) ? (periodo as PeriodoAcesso) : "30",
  };
}

export function inicioPeriodoAcesso(periodo: PeriodoAcesso, agora: Date): string | null {
  return periodo === "todos"
    ? null
    : new Date(agora.getTime() - Number(periodo) * DIA).toISOString();
}

export function filtrarPessoasAcesso(pessoas: PessoaAcesso[], filtros: FiltrosAcesso) {
  return pessoas.filter(
    (p) =>
      (!filtros.marca ||
        (filtros.marca === "sem-marca" ? !p.marca_id : p.marca_id === filtros.marca)) &&
      (!filtros.unidade ||
        (filtros.unidade === "sem-unidade" ? !p.unidade_id : p.unidade_id === filtros.unidade)) &&
      (!filtros.perfil || p.tipo_usuario === filtros.perfil) &&
      (!filtros.serie || (p.tipo_usuario === "aluno" && p.serie === filtros.serie)),
  );
}

export function resumirPessoasAcesso(
  pessoas: PessoaAcesso[],
  desde: string | null,
  agora: Date,
  marcas: MarcaAcesso[],
  unidades: UnidadeAcesso[],
) {
  const marcaNomes = new Map(marcas.map((m) => [m.id, m.nome]));
  const unidadeNomes = new Map(unidades.map((u) => [u.id, u.nome]));
  const inicio = desde ? Date.parse(desde) : -Infinity;
  const fim = agora.getTime();
  const ativos = (dias: number) =>
    pessoas.filter((p) => {
      const ultima = p.ultimo_acesso ? Date.parse(p.ultimo_acesso) : NaN;
      return ultima >= fim - dias * DIA && ultima <= fim;
    }).length;
  const contar = (lista: PessoaAcesso[]) => ({
    cadastros: lista.length,
    pessoas: lista.filter((p) => p.acessou_periodo).length,
    sessoes: lista.reduce((soma, p) => soma + Number(p.sessoes), 0),
    estudantes: lista.filter((p) => p.tipo_usuario === "aluno" && p.estudou_periodo).length,
  });
  const grupos = new Map<
    string,
    {
      marcaId: string | null;
      marca: string;
      unidadeId: string | null;
      unidade: string;
      pessoas: number;
      sessoes: number;
      cadastros: number;
      alunos: number;
      alunosComAcesso: number;
      estudantes: number;
    }
  >();
  for (const p of pessoas) {
    const chave = JSON.stringify([p.marca_id, p.unidade_id]);
    const grupo = grupos.get(chave) ?? {
      marcaId: p.marca_id,
      marca: marcaNomes.get(p.marca_id ?? "") ?? "Sem marca informada",
      unidadeId: p.unidade_id,
      unidade: unidadeNomes.get(p.unidade_id ?? "") ?? "Sem unidade informada",
      pessoas: 0,
      sessoes: 0,
      cadastros: 0,
      alunos: 0,
      alunosComAcesso: 0,
      estudantes: 0,
    };
    grupo.cadastros++;
    grupo.pessoas += Number(p.acessou_periodo);
    grupo.sessoes += Number(p.sessoes);
    if (p.tipo_usuario === "aluno") {
      grupo.alunos++;
      grupo.alunosComAcesso += Number(p.acessou_periodo);
      grupo.estudantes += Number(p.estudou_periodo);
    }
    grupos.set(chave, grupo);
  }
  const alunos = pessoas.filter((p) => p.tipo_usuario === "aluno");
  const series = [...new Set(alunos.map((p) => p.serie))].sort((a, b) =>
    (a ?? "zz").localeCompare(b ?? "zz", "pt-BR", { numeric: true }),
  );
  const medicao =
    pessoas
      .map((p) => p.medicao_desde)
      .filter(
        (d): d is string => d !== null && Number.isFinite(Date.parse(d)) && Date.parse(d) <= fim,
      )
      .sort()[0] ?? null;
  return {
    ...contar(pessoas),
    novosCadastros: pessoas.filter((p) => {
      const criada = Date.parse(p.criado_em);
      return criada >= inicio && criada <= fim;
    }).length,
    ativos7d: ativos(7),
    ativos30d: ativos(30),
    alunos: contar(alunos),
    medicao,
    porPerfil: Object.entries(PERFIS_ACESSO).map(([perfil, nome]) => ({
      perfil,
      nome,
      ...contar(pessoas.filter((p) => p.tipo_usuario === perfil)),
    })),
    porSerie: series.map((serie) => ({
      serie: serie ?? "Sem série informada",
      ...contar(alunos.filter((p) => p.serie === serie)),
    })),
    grupos: [...grupos.values()].sort(
      (a, b) =>
        b.pessoas - a.pessoas ||
        `${a.marca} ${a.unidade}`.localeCompare(`${b.marca} ${b.unidade}`, "pt-BR"),
    ),
  };
}
export type ResumoAcessos = ReturnType<typeof resumirPessoasAcesso>;
