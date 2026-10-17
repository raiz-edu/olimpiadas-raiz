import type { Aluno } from "@/lib/types/database";
import { compoeIndicadoresAluno, perfilPortalNaoConfirmado } from "@/lib/auth/portal-profile";
import {
  respostaCorrigida,
  respostaNoRecorte,
  temRecorteQuestoes,
  type RecorteQuestoes,
} from "./recortes";

export const CONTEXTOS = {
  banco: "Treino livre",
  aula: "Exercícios de aula",
  simulado: "Simulados",
} as const;
export type ContextoEstudo = keyof typeof CONTEXTOS;
export const SITUACOES = {
  retomar: "Retomar estudos",
  sem_estudo: "Acessou, sem estudo registrado",
  nunca_acessou: "Sem acesso registrado",
  em_estudo: "Em estudo",
} as const;
export type SituacaoEstudo = keyof typeof SITUACOES;
export type AlunoBase = Pick<
  Aluno,
  "id" | "nome" | "marca_id" | "turma_id" | "serie" | "login_count" | "last_login_at"
> &
  Partial<Pick<Aluno, "unidade_id" | "tipo_usuario" | "serie_cadastro">>;
export type MarcaBase = { id: string; nome: string };
export type UnidadeBase = { id: string; nome: string; marca_id: string };
export type TurmaBase = { id: string; nome: string; serie: string; unidade_id: string };
export type RespostaEstudo = {
  id: string;
  aluno_id: string;
  questao_id: string;
  correta: boolean | null;
  contexto: string | null;
  aula_id: string | null;
  respondido_em: string;
  feedback_ia: unknown;
  questao: {
    tipo: string;
    topico: string | null;
    assunto: string | null;
    olimpiada: string;
    nivel?: string | null;
    fase?: number | null;
  } | null;
};
export type ProgressoEstudo = {
  aluno_id: string;
  aula_id: string;
  assistido: boolean;
  progresso_segundos: number;
  updated_at: string;
};
export type DadosEngajamento = {
  alunos: AlunoBase[];
  marcas: MarcaBase[];
  unidades: UnidadeBase[];
  turmas: TurmaBase[];
  respostas: RespostaEstudo[];
  progressos: ProgressoEstudo[];
  premiacoes: { aluno_id: string; total: number }[];
};
export type ContagemAcertos = { corrigidas: number; acertos: number; pendentes: number };
export type AlunoEngajamento = AlunoBase & {
  marcaId: string | null;
  marca: string;
  unidadeId: string | null;
  unidade: string;
  serie: string | null;
  turma: string | null;
  diasPratica: string[];
  tentativas: number;
  questoesUnicas: number;
  aulasAssistidas: number;
  premiacoes: number;
  ultimaAtividade: string | null;
  diasSemEstudo: number | null;
  estudouPeriodo: boolean;
  situacao: SituacaoEstudo;
  precisaApoio: boolean;
  desempenho: ContagemAcertos;
  porContexto: Record<ContextoEstudo, ContagemAcertos>;
  topicos: { nome: string; olimpiada: string; corrigidas: number; acertos: number }[];
};
export type PerfilNaoConfirmado = Pick<AlunoBase, "id" | "nome" | "last_login_at"> &
  Pick<AlunoEngajamento, "marcaId" | "marca" | "unidadeId" | "unidade" | "serie" | "turma">;

function resolvedorVinculos(dados: Pick<DadosEngajamento, "marcas" | "unidades" | "turmas">) {
  const marcas = new Map(dados.marcas.map((m) => [m.id, m.nome]));
  const unidades = new Map(dados.unidades.map((u) => [u.id, u]));
  const turmas = new Map(dados.turmas.map((t) => [t.id, t]));
  return (base: AlunoBase) => {
    const turma = base.turma_id ? turmas.get(base.turma_id) : null;
    const unidade = unidades.get(turma?.unidade_id ?? base.unidade_id ?? "");
    const marcaId = base.marca_id ?? unidade?.marca_id ?? null;
    return {
      marcaId,
      marca: marcas.get(marcaId ?? "") ?? "Sem marca informada",
      unidadeId: unidade?.id ?? null,
      unidade: unidade?.nome ?? "Sem unidade informada",
      turma: turma?.nome ?? null,
      serie: base.serie?.trim() || turma?.serie?.trim() || base.serie_cadastro?.trim() || null,
    };
  };
}
export function montarPerfisNaoConfirmados(dados: DadosEngajamento): PerfilNaoConfirmado[] {
  const vinculo = resolvedorVinculos(dados);
  return dados.alunos
    .filter((a) => perfilPortalNaoConfirmado(a.tipo_usuario))
    .map((a) => ({ id: a.id, nome: a.nome, last_login_at: a.last_login_at, ...vinculo(a) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

const DIA_MS = 86_400_000;
const formatadorDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function diaEmSaoPaulo(data: Date | string): string {
  return formatadorDia.format(typeof data === "string" ? new Date(data) : data);
}
function deslocarDia(dia: string, quantidade: number) {
  return new Date(Date.parse(`${dia}T12:00:00Z`) + quantidade * DIA_MS).toISOString().slice(0, 10);
}
export function criarJanelaEstudo(dias: 7 | 30 | 90, agora: Date) {
  const hoje = diaEmSaoPaulo(agora);
  const inicioDia = deslocarDia(hoje, 1 - dias);
  return {
    dias,
    inicio: `${inicioDia}T00:00:00-03:00`,
    fim: agora.toISOString(),
    calendario: Array.from({ length: dias }, (_, i) => deslocarDia(inicioDia, i)),
    inicioAtivos7d: deslocarDia(hoje, -6),
    hoje,
  };
}
export type JanelaEstudo = ReturnType<typeof criarJanelaEstudo>;
export function janelaAnteriorEstudo(janela: JanelaEstudo) {
  return criarJanelaEstudo(janela.dias, new Date(Date.parse(janela.inicio) - 1));
}
export function variacaoAcerto(atual: ContagemAcertos, anterior: ContagemAcertos): number | null {
  if (atual.corrigidas < 5 || anterior.corrigidas < 5) return null;
  return taxaAcerto(atual)! - taxaAcerto(anterior)!;
}

export function taxaAcerto(contagem: ContagemAcertos): number | null {
  return contagem.corrigidas ? (contagem.acertos / contagem.corrigidas) * 100 : null;
}
function contagemVazia(): ContagemAcertos {
  return { corrigidas: 0, acertos: 0, pendentes: 0 };
}
function timestampValido(valor: string | null, agoraMs: number) {
  if (!valor) return null;
  const ms = Date.parse(valor);
  return Number.isFinite(ms) && ms <= agoraMs ? ms : null;
}
function contextoEstudo(valor: string | null): ContextoEstudo | null {
  if (valor === null || valor === "banco") return "banco";
  return valor === "aula" || valor === "simulado" ? valor : null;
}
function somarContagem(destino: ContagemAcertos, origem: ContagemAcertos) {
  destino.corrigidas += origem.corrigidas;
  destino.acertos += origem.acertos;
  destino.pendentes += origem.pendentes;
}

/** Agrega evidências existentes. Não cria presença, sessões ou tempo de estudo. */
export function montarAlunosEngajamento(
  dados: DadosEngajamento,
  janela: JanelaEstudo,
  recorte: RecorteQuestoes = {},
): AlunoEngajamento[] {
  const agoraMs = Date.parse(janela.fim);
  const inicioMs = Date.parse(janela.inicio);
  const vinculo = resolvedorVinculos(dados);
  const premios = new Map(dados.premiacoes.map((p) => [p.aluno_id, p.total]));
  const alunos = new Map<string, AlunoEngajamento>();
  const dias = new Map<string, Set<string>>();
  const questoes = new Map<string, Set<string>>();
  const ultimas = new Map<string, RespostaEstudo>();
  const evidenciasGerais = new Set<string>();

  for (const base of dados.alunos) {
    if (!compoeIndicadoresAluno(base.tipo_usuario)) continue;
    alunos.set(base.id, {
      ...base,
      ...vinculo(base),
      diasPratica: [],
      tentativas: 0,
      questoesUnicas: 0,
      aulasAssistidas: 0,
      premiacoes: premios.get(base.id) ?? 0,
      ultimaAtividade: null,
      diasSemEstudo: null,
      estudouPeriodo: false,
      situacao: "nunca_acessou",
      precisaApoio: false,
      desempenho: contagemVazia(),
      porContexto: { banco: contagemVazia(), aula: contagemVazia(), simulado: contagemVazia() },
      topicos: [],
    });
    dias.set(base.id, new Set());
    questoes.set(base.id, new Set());
  }

  function registrarEstudo(aluno: AlunoEngajamento, ts: string, ms: number) {
    if (!aluno.ultimaAtividade || ms > Date.parse(aluno.ultimaAtividade))
      aluno.ultimaAtividade = ts;
    if (ms >= inicioMs) aluno.estudouPeriodo = true;
  }
  for (const resposta of dados.respostas) {
    const aluno = alunos.get(resposta.aluno_id);
    const ms = timestampValido(resposta.respondido_em, agoraMs);
    if (!aluno || ms === null) continue;
    evidenciasGerais.add(aluno.id);
    if (!respostaNoRecorte(resposta, recorte)) continue;
    registrarEstudo(aluno, resposta.respondido_em, ms);
    if (ms < inicioMs) continue;
    aluno.tentativas++;
    dias.get(aluno.id)!.add(diaEmSaoPaulo(resposta.respondido_em));
    questoes.get(aluno.id)!.add(resposta.questao_id);
    // Mesma regra de identidade do desempenho do aluno: questão, contexto e aula.
    const chave = JSON.stringify([
      aluno.id,
      resposta.questao_id,
      resposta.contexto ?? "banco",
      resposta.aula_id,
    ]);
    const anterior = ultimas.get(chave);
    if (
      !anterior ||
      ms > Date.parse(anterior.respondido_em) ||
      (ms === Date.parse(anterior.respondido_em) && resposta.id > anterior.id)
    )
      ultimas.set(chave, resposta);
  }
  for (const progresso of dados.progressos) {
    const aluno = alunos.get(progresso.aluno_id);
    const ms = timestampValido(progresso.updated_at, agoraMs);
    // Abrir uma aula com progresso zero não comprova estudo.
    if (!aluno || ms === null || (!progresso.assistido && progresso.progresso_segundos <= 0))
      continue;
    evidenciasGerais.add(aluno.id);
    if (temRecorteQuestoes(recorte)) continue;
    registrarEstudo(aluno, progresso.updated_at, ms);
    if (ms >= inicioMs && progresso.assistido) aluno.aulasAssistidas++;
  }

  const topicos = new Map<string, Map<string, AlunoEngajamento["topicos"][number]>>();
  for (const resposta of ultimas.values()) {
    const aluno = alunos.get(resposta.aluno_id)!;
    const contexto = contextoEstudo(resposta.contexto);
    // Uma questão excluída ou aberta sem avaliação não equivale a um erro.
    const pendente = !respostaCorrigida(resposta);
    const contagem = {
      corrigidas: pendente ? 0 : 1,
      acertos: !pendente && resposta.correta ? 1 : 0,
      pendentes: pendente ? 1 : 0,
    };
    somarContagem(aluno.desempenho, contagem);
    if (contexto) somarContagem(aluno.porContexto[contexto], contagem);
    if (pendente) continue;
    const nome =
      resposta.questao!.topico?.trim() ||
      resposta.questao!.assunto?.trim() ||
      "Sem tópico informado";
    const olimpiada = resposta.questao!.olimpiada;
    const chave = JSON.stringify([olimpiada, nome]);
    const porAluno = topicos.get(aluno.id) ?? new Map();
    const topico = porAluno.get(chave) ?? { nome, olimpiada, corrigidas: 0, acertos: 0 };
    topico.corrigidas++;
    topico.acertos += contagem.acertos;
    porAluno.set(chave, topico);
    topicos.set(aluno.id, porAluno);
  }
  for (const aluno of alunos.values()) {
    aluno.diasPratica = [...dias.get(aluno.id)!].sort();
    aluno.questoesUnicas = questoes.get(aluno.id)!.size;
    aluno.topicos = [...(topicos.get(aluno.id)?.values() ?? [])];
    if (aluno.ultimaAtividade) {
      const ultimoDia = diaEmSaoPaulo(aluno.ultimaAtividade);
      aluno.diasSemEstudo = Math.round((Date.parse(janela.hoje) - Date.parse(ultimoDia)) / DIA_MS);
      aluno.situacao = ultimoDia < janela.inicioAtivos7d ? "retomar" : "em_estudo";
    } else if (
      aluno.login_count > 0 ||
      timestampValido(aluno.last_login_at, agoraMs) !== null ||
      evidenciasGerais.has(aluno.id)
    ) {
      aluno.situacao = "sem_estudo";
    }
    aluno.precisaApoio =
      aluno.desempenho.corrigidas >= 5 && (taxaAcerto(aluno.desempenho) ?? 100) < 50;
  }
  return [...alunos.values()];
}

export type FiltrosEngajamento = Required<RecorteQuestoes> & {
  marca: string;
  unidade: string;
  serie: string;
  busca: string;
  periodo: 7 | 30 | 90;
  situacao: SituacaoEstudo | "apoio" | "";
  ordenar: "atencao" | "atividade" | "acerto" | "nome";
  pagina: number;
  // null mantém a lista recolhida até uma navegação explícita ou um recorte sem alunos.
  pagina_perfis: number | null;
};
export function lerFiltrosEngajamento(
  params: Record<string, string | string[] | undefined>,
): FiltrosEngajamento {
  const texto = (chave: string) =>
    typeof params[chave] === "string" ? params[chave].trim().slice(0, 120) : "";
  const situacao = texto("situacao");
  const ordenar = texto("ordenar");
  const pagina = Number(texto("pagina"));
  const paginaPerfis = Number(texto("pagina_perfis"));
  return {
    olimpiada: texto("olimpiada"),
    nivel: texto("nivel"),
    fase: texto("fase"),
    marca: texto("marca"),
    unidade: texto("unidade"),
    serie: texto("serie"),
    busca: texto("busca").trim().slice(0, 120),
    periodo: texto("periodo") === "7" ? 7 : texto("periodo") === "90" ? 90 : 30,
    situacao:
      situacao === "apoio" || Object.hasOwn(SITUACOES, situacao)
        ? (situacao as FiltrosEngajamento["situacao"])
        : "",
    ordenar:
      ordenar === "atividade" || ordenar === "acerto" || ordenar === "nome" ? ordenar : "atencao",
    pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1,
    pagina_perfis: Number.isSafeInteger(paginaPerfis) && paginaPerfis > 0 ? paginaPerfis : null,
  };
}
function normalizarBusca(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
export function filtrarCoorte<
  T extends Pick<AlunoEngajamento, "nome" | "marcaId" | "unidadeId" | "serie">,
>(alunos: T[], filtros: FiltrosEngajamento) {
  return alunos.filter(
    (a) =>
      (!filtros.marca || (a.marcaId ?? "sem-vinculo") === filtros.marca) &&
      (!filtros.unidade || (a.unidadeId ?? "sem-vinculo") === filtros.unidade) &&
      (!filtros.serie || (a.serie ?? "sem-vinculo") === filtros.serie) &&
      (!filtros.busca || normalizarBusca(a.nome).includes(normalizarBusca(filtros.busca))),
  );
}
export function selecionarAlunos(alunos: AlunoEngajamento[], filtros: FiltrosEngajamento) {
  const prioridade = (a: AlunoEngajamento) =>
    a.situacao === "retomar"
      ? 0
      : a.precisaApoio
        ? 1
        : a.situacao === "sem_estudo"
          ? 2
          : a.situacao === "nunca_acessou"
            ? 3
            : 4;
  return alunos
    .filter(
      (a) =>
        !filtros.situacao ||
        (filtros.situacao === "apoio" ? a.precisaApoio : a.situacao === filtros.situacao),
    )
    .sort((a, b) => {
      let diferenca = 0;
      if (filtros.ordenar === "atencao") diferenca = prioridade(a) - prioridade(b);
      if (filtros.ordenar === "atividade") diferenca = b.diasPratica.length - a.diasPratica.length;
      if (filtros.ordenar === "acerto")
        diferenca = (taxaAcerto(a.desempenho) ?? 101) - (taxaAcerto(b.desempenho) ?? 101);
      return diferenca || a.nome.localeCompare(b.nome, "pt-BR");
    });
}
export function resumirEngajamento(alunos: AlunoEngajamento[], janela: JanelaEstudo) {
  const desempenho = contagemVazia();
  const porContexto = { banco: contagemVazia(), aula: contagemVazia(), simulado: contagemVazia() };
  for (const a of alunos) {
    somarContagem(desempenho, a.desempenho);
    for (const contexto of Object.keys(CONTEXTOS) as ContextoEstudo[])
      somarContagem(porContexto[contexto], a.porContexto[contexto]);
  }
  return {
    total: alunos.length,
    ativos: alunos.filter((a) => a.estudouPeriodo).length,
    comRespostas: alunos.filter((a) => a.tentativas > 0).length,
    retomar: alunos.filter((a) => a.situacao === "retomar").length,
    semEstudo: alunos.filter((a) => a.situacao === "sem_estudo").length,
    semAcesso: alunos.filter((a) => a.situacao === "nunca_acessou").length,
    apoio: alunos.filter((a) => a.precisaApoio).length,
    tentativas: alunos.reduce((s, a) => s + a.tentativas, 0),
    aulasAssistidas: alunos.reduce((s, a) => s + a.aulasAssistidas, 0),
    desempenho,
    porContexto,
    diario: janela.calendario.map((dia) => ({
      dia,
      alunos: alunos.filter((a) => a.diasPratica.includes(dia)).length,
    })),
  };
}
export function agruparEngajamento(
  alunos: AlunoEngajamento[],
  por: "marca" | "unidade",
  janela: JanelaEstudo,
) {
  const grupos = new Map<string, { nome: string; marca: string; alunos: AlunoEngajamento[] }>();
  for (const aluno of alunos) {
    const id = (por === "marca" ? aluno.marcaId : aluno.unidadeId) ?? "sem-vinculo";
    const nome = por === "marca" ? aluno.marca : aluno.unidade;
    const grupo = grupos.get(id) ?? { nome, marca: aluno.marca, alunos: [] };
    if (grupo.marca !== aluno.marca) grupo.marca = "Várias marcas";
    grupo.alunos.push(aluno);
    grupos.set(id, grupo);
  }
  return [...grupos.entries()]
    .map(([id, grupo]) => ({
      id,
      nome: grupo.nome,
      marca: grupo.marca,
      resumo: resumirEngajamento(grupo.alunos, janela),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export function topicosParaRevisar(alunos: AlunoEngajamento[]) {
  const grupos = new Map<
    string,
    { nome: string; olimpiada: string; corrigidas: number; acertos: number; alunos: Set<string> }
  >();
  for (const aluno of alunos)
    for (const topico of aluno.topicos) {
      const chave = JSON.stringify([topico.olimpiada, topico.nome]);
      const grupo = grupos.get(chave) ?? {
        ...topico,
        corrigidas: 0,
        acertos: 0,
        alunos: new Set<string>(),
      };
      grupo.corrigidas += topico.corrigidas;
      grupo.acertos += topico.acertos;
      grupo.alunos.add(aluno.id);
      grupos.set(chave, grupo);
    }
  return [...grupos.values()]
    .filter((g) => g.corrigidas >= 5 && g.acertos / g.corrigidas < 0.7)
    .sort(
      (a, b) => a.acertos / a.corrigidas - b.acertos / b.corrigidas || b.corrigidas - a.corrigidas,
    )
    .slice(0, 5)
    .map((g) => ({ ...g, alunos: g.alunos.size }));
}
