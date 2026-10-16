import Link from "next/link";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  CONTEXTOS,
  SITUACOES,
  agruparEngajamento,
  filtrarCoorte,
  resumirEngajamento,
  selecionarAlunos,
  taxaAcerto,
  topicosParaRevisar,
  type AlunoEngajamento,
  type ContagemAcertos,
  type ContextoEstudo,
  type FiltrosEngajamento,
  type JanelaEstudo,
} from "@/lib/engajamento/metricas";
import { AtividadeChart } from "./atividade-chart";

const CAMPO =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const CARTAO = "min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5";
const POR_PAGINA = 25;
const numero = (valor: number) => valor.toLocaleString("pt-BR");
const percentual = (valor: number | null) =>
  valor === null ? "—" : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
function dataCurta(iso: string | null) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(iso));
}
export function urlEngajamento(
  filtros: FiltrosEngajamento,
  alteracoes: Partial<FiltrosEngajamento> = {},
  ancora = "",
) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries({ ...filtros, ...alteracoes })) {
    if (valor !== "" && !(chave === "pagina" && valor === 1)) params.set(chave, String(valor));
  }
  return `/academico/desempenho?${params.toString()}${ancora}`;
}
function Acerto({ dados }: { dados: ContagemAcertos }) {
  const taxa = taxaAcerto(dados);
  return (
    <div className="tabular-nums">
      <span
        className={`font-semibold ${taxa === null ? "text-muted-foreground" : taxa >= 70 ? "text-emerald-300" : taxa >= 50 ? "text-amber-300" : "text-rose-300"}`}
      >
        {percentual(taxa)}
      </span>
      <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
        {taxa === null
          ? dados.pendentes
            ? "Correção pendente"
            : "Sem respostas corrigidas"
          : `${numero(dados.acertos)}/${numero(dados.corrigidas)} acertos`}
      </p>
      {taxa !== null && dados.pendentes > 0 && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {numero(dados.pendentes)} sem correção
        </p>
      )}
    </div>
  );
}
function Situacao({ aluno }: { aluno: AlunoEngajamento }) {
  const cores =
    aluno.situacao === "retomar"
      ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
      : aluno.situacao === "em_estudo"
        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
        : "border-border bg-muted/30 text-slate-300";
  return (
    <div className="space-y-1.5">
      <span className={`inline-block rounded-md border px-2 py-1 text-[11px] font-medium ${cores}`}>
        {SITUACOES[aluno.situacao]}
      </span>
      {aluno.precisaApoio && (
        <span className="block w-fit rounded-md border border-violet-400/25 bg-violet-400/10 px-2 py-1 text-[11px] font-medium text-violet-200">
          Apoio nas questões
        </span>
      )}
    </div>
  );
}
function DetalheAluno({ aluno, janela }: { aluno: AlunoEngajamento; janela: JanelaEstudo }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="w-fit cursor-pointer rounded py-1 font-medium text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Ver análise
      </summary>
      <div className="mt-2 space-y-3 rounded-xl border border-border bg-background p-3 font-normal text-foreground">
        <p>
          <span className="text-muted-foreground">Último estudo:</span>{" "}
          {dataCurta(aluno.ultimaAtividade)}
          {aluno.diasSemEstudo !== null ? ` · há ${aluno.diasSemEstudo} dia(s)` : ""}
        </p>
        <div>
          <p className="mb-2 text-muted-foreground">
            Últimos {janela.dias} dias · {aluno.diasPratica.length} dia(s) com respostas
          </p>
          <div
            className="flex max-w-72 flex-wrap gap-1"
            aria-label={`${aluno.diasPratica.length} de ${janela.dias} dias com respostas`}
          >
            {janela.calendario.map((dia) => (
              <span
                key={dia}
                className={`h-2.5 w-2.5 rounded-sm ${aluno.diasPratica.includes(dia) ? "bg-teal-400" : "bg-slate-700"}`}
                title={`${dataCurta(`${dia}T12:00:00-03:00`)}: ${aluno.diasPratica.includes(dia) ? "com respostas" : "sem respostas"}`}
              />
            ))}
          </div>
        </div>
        <dl className="space-y-2">
          {(Object.keys(CONTEXTOS) as ContextoEstudo[]).map((contexto) => (
            <div
              key={contexto}
              className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-2 last:border-0"
            >
              <dt className="text-muted-foreground">{CONTEXTOS[contexto]}</dt>
              <dd className="text-right">
                <Acerto dados={aluno.porContexto[contexto]} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-border pt-2 text-muted-foreground">
          Histórico: {numero(aluno.premiacoes)} premiação(ões) · {numero(aluno.login_count)}{" "}
          login(s). Último login: {dataCurta(aluno.last_login_at)}.
        </p>
      </div>
    </details>
  );
}
function Grupos({
  alunos,
  por,
  filtros,
  janela,
}: {
  alunos: AlunoEngajamento[];
  por: "marca" | "unidade";
  filtros: FiltrosEngajamento;
  janela: JanelaEstudo;
}) {
  const grupos = agruparEngajamento(alunos, por, janela);
  return (
    <div
      className="overflow-x-auto rounded-xl border border-border/60"
      role="region"
      aria-label={`Indicadores por ${por}`}
      tabIndex={0}
    >
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">
          Comparação por {por}, incluindo todos os alunos do recorte
        </caption>
        <thead className="border-b border-border bg-background/50 text-[11px] text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              {por === "marca" ? "Marca" : "Unidade"}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Alunos
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Estudaram no período
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Retomar
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Acertos
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {grupos.map((g) => {
            const participacao = g.resumo.total ? (g.resumo.ativos / g.resumo.total) * 100 : 0;
            return (
              <tr key={g.id} className="hover:bg-background/25">
                <th scope="row" className="px-4 py-3 font-medium">
                  <Link
                    className="rounded hover:text-cyan-300 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    href={urlEngajamento(
                      filtros,
                      por === "marca"
                        ? { marca: g.id, unidade: "", pagina: 1 }
                        : { unidade: g.id, pagina: 1 },
                    )}
                  >
                    {g.nome}
                  </Link>
                  {por === "unidade" && (
                    <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                      {g.marca}
                    </p>
                  )}
                </th>
                <td className="px-3 py-3 text-right tabular-nums">{numero(g.resumo.total)}</td>
                <td className="min-w-40 px-3 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span>
                      {numero(g.resumo.ativos)}/{numero(g.resumo.total)}
                    </span>
                    <span className="text-muted-foreground">{percentual(participacao)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{ width: `${participacao}%` }}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{numero(g.resumo.retomar)}</td>
                <td className="px-4 py-3 text-right">
                  <Acerto dados={g.resumo.desempenho} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PainelEngajamento({
  alunos,
  filtros,
  janela,
}: {
  alunos: AlunoEngajamento[];
  filtros: FiltrosEngajamento;
  janela: JanelaEstudo;
}) {
  const coorte = filtrarCoorte(alunos, filtros);
  const resumo = resumirEngajamento(coorte, janela);
  const selecionados = selecionarAlunos(coorte, filtros);
  const paginas = Math.max(1, Math.ceil(selecionados.length / POR_PAGINA));
  const pagina = Math.min(filtros.pagina, paginas);
  const linhas = selecionados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const revisoes = topicosParaRevisar(coorte);
  const marcas = [
    ...new Map(alunos.map((a) => [a.marcaId ?? "sem-vinculo", a.marca])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const unidades = [
    ...new Map(
      alunos.map((a) => [
        a.unidadeId ?? "sem-vinculo",
        a.unidadeId ? `${a.unidade} · ${a.marca}` : a.unidade,
      ]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const series = [...new Set(alunos.map((a) => a.serie ?? "sem-vinculo"))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
  const campos = [
    { nome: "marca", rotulo: "Marca", padrao: "Todas as marcas", opcoes: marcas },
    { nome: "unidade", rotulo: "Unidade", padrao: "Todas as unidades", opcoes: unidades },
    {
      nome: "serie",
      rotulo: "Série",
      padrao: "Todas as séries",
      opcoes: series.map((s) => [s, s === "sem-vinculo" ? "Sem série informada" : s]),
    },
    {
      nome: "periodo",
      rotulo: "Período",
      padrao: "",
      opcoes: [7, 30, 90].map((n) => [String(n), `Últimos ${n} dias`]),
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-teal-300">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Acompanhamento pedagógico
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Engajamento e desempenho
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Entenda a participação dos alunos, identifique dificuldades e organize os próximos
            acompanhamentos.
          </p>
        </div>
        <p className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {dataCurta(janela.inicio)} a {dataCurta(janela.fim)}
        </p>
      </header>

      <form
        key={`recorte-${urlEngajamento(filtros)}`}
        action="/academico/desempenho"
        className={`${CARTAO} grid gap-3 sm:grid-cols-2 xl:grid-cols-6`}
        aria-label="Filtrar acompanhamento pedagógico"
      >
        {campos.map((campo) => (
          <label
            key={campo.nome}
            className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground"
          >
            {campo.rotulo}
            <select
              aria-label={campo.rotulo}
              className={CAMPO}
              name={campo.nome}
              defaultValue={String(filtros[campo.nome as keyof FiltrosEngajamento])}
            >
              {campo.padrao && <option value="">{campo.padrao}</option>}
              {String(filtros[campo.nome as keyof FiltrosEngajamento]) &&
                !campo.opcoes.some(
                  ([id]) => id === String(filtros[campo.nome as keyof FiltrosEngajamento]),
                ) && (
                  <option value={String(filtros[campo.nome as keyof FiltrosEngajamento])}>
                    Filtro não encontrado
                  </option>
                )}
              {campo.opcoes.map(([id, nome]) => (
                <option key={id} value={id}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">
          Buscar aluno
          <input
            className={CAMPO}
            name="busca"
            type="search"
            defaultValue={filtros.busca}
            placeholder="Nome do aluno"
            maxLength={120}
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="h-10 flex-1 rounded-lg bg-teal-300 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Aplicar filtros
          </button>
          <Link
            className="rounded py-2 text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            href="/academico/desempenho"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            titulo: "Alunos no recorte",
            valor: numero(resumo.total),
            descricao: "Todos os cadastros ativos, inclusive sem estudo",
            Icone: Users,
          },
          {
            titulo: "Estudaram no período",
            valor: numero(resumo.ativos),
            descricao: `${percentual(resumo.total ? (resumo.ativos / resumo.total) * 100 : null)} dos alunos · respostas ou progresso em aula`,
            Icone: Activity,
          },
          {
            titulo: "Tentativas registradas",
            valor: numero(resumo.tentativas),
            descricao: `${numero(resumo.comRespostas)} aluno(s) responderam questões`,
            Icone: BookOpen,
          },
          {
            titulo: "Taxa de acerto",
            valor: percentual(taxaAcerto(resumo.desempenho)),
            descricao: resumo.desempenho.corrigidas
              ? `${numero(resumo.desempenho.acertos)} acertos / ${numero(resumo.desempenho.corrigidas)} respostas corrigidas`
              : "Ainda sem respostas corrigidas neste período",
            Icone: GraduationCap,
          },
        ].map(({ titulo, valor, descricao, Icone }) => (
          <section key={titulo} className={CARTAO} aria-label={titulo}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">{titulo}</h2>
              <Icone className="h-4 w-4 text-teal-300" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {valor}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{descricao}</p>
          </section>
        ))}
      </div>

      {coorte.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border py-14 text-center">
          <Users className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-semibold">Nenhum aluno neste recorte</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revise a marca, a unidade, a série ou o nome pesquisado.
          </p>
          <Link
            href="/academico/desempenho"
            className="mt-4 inline-block text-sm text-cyan-300 underline underline-offset-4"
          >
            Ver todos os alunos
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="acompanhamento-titulo">
            <h2 id="acompanhamento-titulo" className="mb-3 text-sm font-semibold">
              Onde acompanhar mais de perto
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  filtro: "retomar" as const,
                  total: resumo.retomar,
                  titulo: "Retomar estudos",
                  descricao: "Sem evidência de estudo nos últimos 7 dias",
                  cor: "text-amber-200",
                },
                {
                  filtro: "apoio" as const,
                  total: resumo.apoio,
                  titulo: "Apoio nas questões",
                  descricao: "Abaixo de 50% · pelo menos 5 respostas corrigidas",
                  cor: "text-violet-200",
                },
                {
                  filtro: "sem_estudo" as const,
                  total: resumo.semEstudo,
                  titulo: "Incentivar o primeiro estudo",
                  descricao: "Já fez login, mas ainda não há estudo registrado",
                  cor: "text-cyan-200",
                },
                {
                  filtro: "nunca_acessou" as const,
                  total: resumo.semAcesso,
                  titulo: "Conferir o acesso",
                  descricao: "Cadastro ativo sem login ou estudo registrado",
                  cor: "text-slate-200",
                },
              ].map((item) => (
                <Link
                  key={item.filtro}
                  href={urlEngajamento(filtros, { situacao: item.filtro, pagina: 1 }, "#alunos")}
                  className="group rounded-xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-teal-300/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-xs font-medium ${item.cor}`}>{item.titulo}</h3>
                    <span className={`text-2xl font-semibold tabular-nums ${item.cor}`}>
                      {numero(item.total)}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {item.descricao}
                  </p>
                  <span className="mt-3 inline-block text-[11px] font-medium text-teal-300 group-hover:underline">
                    Ver alunos →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <section className={CARTAO} aria-labelledby="atividade-titulo">
              <h2 id="atividade-titulo" className="text-sm font-semibold">
                Frequência de prática
              </h2>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
                Alunos distintos com respostas em cada dia. Um aluno conta uma vez por dia.
              </p>
              <AtividadeChart dados={resumo.diario} />
            </section>
            <section className={CARTAO} aria-labelledby="contextos-titulo">
              <h2 id="contextos-titulo" className="text-sm font-semibold">
                Desempenho por atividade
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Separe a prática livre das questões de aula e dos simulados.
              </p>
              <dl className="mt-5 space-y-4">
                {(Object.keys(CONTEXTOS) as ContextoEstudo[]).map((contexto) => (
                  <div
                    key={contexto}
                    className="flex items-start justify-between gap-3 border-b border-border/50 pb-4 last:border-0"
                  >
                    <dt className="pt-0.5 text-sm">{CONTEXTOS[contexto]}</dt>
                    <dd className="text-right text-sm">
                      <Acerto dados={resumo.porContexto[contexto]} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {numero(resumo.aulasAssistidas)} registro(s) de aulas assistidas atualizados no
                período.
              </p>
            </section>
          </div>

          <section className={CARTAO} aria-labelledby="grupos-titulo">
            <h2 id="grupos-titulo" className="text-sm font-semibold">
              Participação e resultados por marca
            </h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
              A base inclui todos os alunos do recorte. Selecione uma marca ou unidade para
              aprofundar.
            </p>
            <Grupos alunos={coorte} por="marca" filtros={filtros} janela={janela} />
            <details className="mt-4">
              <summary className="w-fit cursor-pointer rounded py-1 text-xs font-medium text-teal-300 focus-visible:outline-2 focus-visible:outline-ring">
                Detalhar por unidade
              </summary>
              <div className="mt-3">
                <Grupos alunos={coorte} por="unidade" filtros={filtros} janela={janela} />
              </div>
            </details>
          </section>

          <section className={CARTAO} aria-labelledby="topicos-titulo">
            <h2 id="topicos-titulo" className="text-sm font-semibold">
              Tópicos para revisar com os alunos
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Até cinco tópicos com menos de 70% de acerto e pelo menos cinco respostas corrigidas
              no recorte.
            </p>
            {revisoes.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {revisoes.map((t) => (
                  <div
                    key={`${t.olimpiada}|${t.nome}`}
                    className="rounded-xl border border-border/60 bg-background/30 p-3"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-teal-300">
                      {t.olimpiada}
                    </p>
                    <h3 className="mt-1 text-sm font-medium">{t.nome}</h3>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <strong className="text-xl text-amber-200 tabular-nums">
                        {percentual((t.acertos / t.corrigidas) * 100)}
                      </strong>
                      <span className="text-[11px] text-muted-foreground">
                        {numero(t.acertos)}/{numero(t.corrigidas)} acertos · {numero(t.alunos)}{" "}
                        aluno(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-background/30 p-3 text-xs leading-relaxed text-muted-foreground">
                Nenhum tópico atende a esse critério neste período. Isso pode significar bons
                resultados ou quantidade insuficiente de respostas para análise.
              </p>
            )}
          </section>

          <section id="alunos" className={`${CARTAO} scroll-mt-6`} aria-labelledby="alunos-titulo">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="alunos-titulo" className="text-sm font-semibold">
                  Acompanhamento por aluno
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {numero(selecionados.length)} de {numero(coorte.length)} alunos do recorte. Abra a
                  análise para ver o histórico e cada atividade.
                </p>
              </div>
              <form
                key={`lista-${urlEngajamento(filtros)}`}
                action="/academico/desempenho#alunos"
                className="flex w-full flex-wrap items-end gap-2 sm:w-auto"
                aria-label="Refinar lista de alunos"
              >
                {(["marca", "unidade", "serie", "periodo", "busca"] as const).map((chave) => (
                  <input key={chave} type="hidden" name={chave} value={String(filtros[chave])} />
                ))}
                <label className="min-w-0 basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto">
                  Situação
                  <select
                    aria-label="Situação"
                    name="situacao"
                    defaultValue={filtros.situacao}
                    className={`${CAMPO} sm:w-48`}
                  >
                    <option value="">Todas as situações</option>
                    <option value="apoio">Apoio nas questões</option>
                    {Object.entries(SITUACOES).map(([id, nome]) => (
                      <option key={id} value={id}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto">
                  Ordenar
                  <select
                    aria-label="Ordenar"
                    name="ordenar"
                    defaultValue={filtros.ordenar}
                    className={`${CAMPO} sm:w-44`}
                  >
                    <option value="atencao">Priorizar acompanhamento</option>
                    <option value="atividade">Mais dias de prática</option>
                    <option value="acerto">Menor taxa de acerto</option>
                    <option value="nome">Nome do aluno</option>
                  </select>
                </label>
                <button
                  className="h-10 w-full rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring sm:w-auto"
                  type="submit"
                >
                  Atualizar
                </button>
              </form>
            </div>
            <p className="mb-4 mt-3 text-[11px] text-muted-foreground">
              Situação e ordenação refinam esta lista. Os indicadores acima continuam mostrando todo
              o recorte.
            </p>
            {linhas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum aluno nesta situação.{" "}
                <Link
                  className="text-cyan-300 underline"
                  href={urlEngajamento(filtros, { situacao: "", pagina: 1 }, "#alunos")}
                >
                  Ver todas as situações
                </Link>
              </p>
            ) : (
              <>
                <div
                  className="hidden overflow-x-auto rounded-xl border border-border/60 md:block"
                  role="region"
                  aria-label="Tabela de acompanhamento dos alunos"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[800px] text-sm">
                    <caption className="sr-only">
                      Dias de prática, tentativas e acertos no período selecionado
                    </caption>
                    <thead className="border-b border-border bg-background/50 text-[11px] text-muted-foreground">
                      <tr>
                        {[
                          "Aluno",
                          "Situação",
                          "Dias de prática",
                          "Tentativas",
                          "Acertos",
                          "Aulas assistidas",
                        ].map((titulo, i) => (
                          <th
                            key={titulo}
                            scope="col"
                            className={`px-4 py-3 font-medium ${i > 1 ? "text-right" : "text-left"}`}
                          >
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {linhas.map((aluno) => (
                        <tr key={aluno.id} className="align-top hover:bg-background/20">
                          <th scope="row" className="w-[30%] px-4 py-4 text-left font-medium">
                            <span>{aluno.nome}</span>
                            <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                              {aluno.marca} · {aluno.unidade}
                            </p>
                            <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                              {aluno.serie ?? "Sem série"}
                              {aluno.turma ? ` · ${aluno.turma}` : ""}
                            </p>
                            <DetalheAluno aluno={aluno} janela={janela} />
                          </th>
                          <td className="px-4 py-4">
                            <Situacao aluno={aluno} />
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Último estudo: {dataCurta(aluno.ultimaAtividade)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            <span className="font-medium">{aluno.diasPratica.length}</span>
                            <span className="text-xs text-muted-foreground"> / {janela.dias}</span>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            {numero(aluno.tentativas)}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {numero(aluno.questoesUnicas)} questões distintas
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Acerto dados={aluno.desempenho} />
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            {numero(aluno.aulasAssistidas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 md:hidden">
                  {linhas.map((aluno) => (
                    <article
                      key={aluno.id}
                      className="rounded-xl border border-border/70 bg-background/20 p-4"
                    >
                      <h3 className="text-sm font-semibold">{aluno.nome}</h3>
                      <p className="mb-3 mt-1 text-xs text-muted-foreground">
                        {aluno.marca} · {aluno.unidade} · {aluno.serie ?? "Sem série"}
                      </p>
                      <Situacao aluno={aluno} />
                      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Dias de prática</dt>
                          <dd className="mt-1 font-medium">
                            {aluno.diasPratica.length}/{janela.dias}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Tentativas</dt>
                          <dd className="mt-1 font-medium">{numero(aluno.tentativas)}</dd>
                        </div>
                        <div>
                          <dt className="mb-1 text-[11px] text-muted-foreground">Acertos</dt>
                          <dd>
                            <Acerto dados={aluno.desempenho} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Último estudo</dt>
                          <dd className="mt-1">{dataCurta(aluno.ultimaAtividade)}</dd>
                        </div>
                      </dl>
                      <DetalheAluno aluno={aluno} janela={janela} />
                    </article>
                  ))}
                </div>
              </>
            )}
            {selecionados.length > 0 && (
              <nav
                className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
                aria-label="Paginação de alunos"
              >
                <span>
                  Mostrando {numero((pagina - 1) * POR_PAGINA + 1)}–
                  {numero(Math.min(pagina * POR_PAGINA, selecionados.length))} de{" "}
                  {numero(selecionados.length)} alunos
                </span>
                <div className="flex items-center gap-3">
                  {pagina > 1 && (
                    <Link
                      rel="prev"
                      href={urlEngajamento(filtros, { pagina: pagina - 1 }, "#alunos")}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 hover:bg-muted"
                    >
                      <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                      Anterior
                    </Link>
                  )}
                  <span>
                    Página {pagina} de {paginas}
                  </span>
                  {pagina < paginas && (
                    <Link
                      rel="next"
                      href={urlEngajamento(filtros, { pagina: pagina + 1 }, "#alunos")}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 hover:bg-muted"
                    >
                      Próxima
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </section>
        </>
      )}

      <details className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
        <summary className="flex w-fit cursor-pointer items-center gap-2 rounded font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <CircleHelp className="h-4 w-4 text-teal-300" aria-hidden="true" />
          Como interpretar os indicadores
        </summary>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            O período inclui hoje e segue o horário de São Paulo. Todos os indicadores de prática e
            acerto usam o período escolhido.
          </li>
          <li>
            Dias de prática contam dias distintos com respostas. Assistir a uma aula pode contar
            como estudo mesmo sem responder questões; o progresso disponível não reconstrói todos os
            dias de visualização.
          </li>
          <li>
            Tentativas incluem repetições. A taxa usa a última resposta de cada questão por contexto
            e aula dentro do período, com média ponderada pelo total de respostas corrigidas.
          </li>
          <li>
            Respostas abertas sem avaliação ficam fora da taxa de acerto. “Sem respostas corrigidas”
            não significa 0%. Os percentuais não são uma nota oficial e podem variar com a
            dificuldade das questões.
          </li>
          <li>
            Retomar estudos significa ausência de evidência nos últimos 7 dias, independentemente do
            período selecionado. Apoio nas questões indica menos de 50% de acerto em pelo menos 5
            respostas corrigidas; é um sinal para análise pedagógica.
          </li>
          <li>
            Aulas assistidas são registros marcados como assistidos e atualizados no período; não
            comprovam presença em encontros nem tempo efetivo assistido. Logins e premiações,
            disponíveis na análise do aluno, são históricos acumulados.
          </li>
        </ul>
      </details>
    </div>
  );
}
