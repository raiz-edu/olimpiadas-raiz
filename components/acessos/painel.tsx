import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Filter,
  GraduationCap,
  UserPlus,
  Users,
} from "lucide-react";
import {
  filtrarPessoasAcesso,
  inicioPeriodoAcesso,
  resumirPessoasAcesso,
  PERFIS_ACESSO,
  PERIODOS_ACESSO,
  type FiltrosAcesso,
  type MarcaAcesso,
  type PessoaAcesso,
  type UnidadeAcesso,
} from "@/lib/acessos/metricas";

const numero = (n: number) => n.toLocaleString("pt-BR");
const percentual = (valor: number, base: number) =>
  base > 0
    ? `${((valor / base) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
    : "—";
const CAMPO =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
const LINK =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary";

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Barra({ valor, base, cor }: { valor: number; base: number; cor: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <div
        className={`h-full rounded-full ${cor}`}
        style={{ width: `${base ? Math.min(100, (valor / base) * 100) : 0}%` }}
      />
    </div>
  );
}

export function PainelAcessos({
  pessoas,
  marcas,
  unidades,
  filtros,
  agora,
  restrito = false,
}: {
  pessoas: PessoaAcesso[];
  marcas: MarcaAcesso[];
  unidades: UnidadeAcesso[];
  filtros: FiltrosAcesso;
  agora: Date;
  restrito?: boolean;
}) {
  const recorte = filtrarPessoasAcesso(pessoas, filtros);
  const resumo = resumirPessoasAcesso(
    recorte,
    inicioPeriodoAcesso(filtros.periodo, agora),
    agora,
    marcas,
    unidades,
  );
  const unidadesDisponiveis = unidades.filter(
    (u) => !filtros.marca || u.marca_id === filtros.marca,
  );
  const series = [
    ...new Set(pessoas.filter((p) => p.tipo_usuario === "aluno" && p.serie).map((p) => p.serie!)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const pendentes = resumo.porPerfil.find((p) => p.perfil === "pendente")!.cadastros;
  const indicadores = [
    {
      nome: "Pessoas com acesso",
      valor: resumo.pessoas,
      detalhe: `de ${numero(resumo.cadastros)} cadastros no recorte`,
      Icone: Users,
    },
    {
      nome: "Sessões no período",
      valor: resumo.sessoes,
      detalhe: "visitas medidas na nova coleta",
      Icone: Activity,
    },
    {
      nome: "Novos cadastros",
      valor: resumo.novosCadastros,
      detalhe: "criados no período selecionado",
      Icone: UserPlus,
    },
    {
      nome: "Ativos em 7 dias",
      valor: resumo.ativos7d,
      detalhe: "janela fixa de últimos 7 dias",
      Icone: CalendarDays,
    },
    {
      nome: "Ativos em 30 dias",
      valor: resumo.ativos30d,
      detalhe: "janela fixa de últimos 30 dias",
      Icone: CalendarDays,
    },
    {
      nome: "Perfis pendentes",
      valor: pendentes,
      detalhe: "cadastros sem perfil confirmado",
      Icone: Users,
    },
  ];
  const baseAlunos = resumo.alunos.cadastros;
  const acompanhamento = new URLSearchParams();
  for (const campo of ["marca", "unidade", "serie"] as const) {
    if (filtros[campo] && !filtros[campo].startsWith("sem-"))
      acompanhamento.set(campo, filtros[campo]);
  }
  if (filtros.periodo !== "todos") acompanhamento.set("periodo", filtros.periodo);
  const desempenhoHref = `/academico/desempenho${acompanhamento.size ? `?${acompanhamento}` : ""}`;
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Acadêmico · uso da plataforma
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Acessos e participação
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Acompanhe a adesão de alunos, professores e equipes. Veja onde o acesso se transforma em
            estudo.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {restrito ? "Visão da sua marca." : "Visão de toda a rede, conforme os filtros."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/analytics" className={LINK}>
            Visão geral da gestão
          </Link>
          <Link href={desempenhoHref} className={LINK}>
            Desempenho dos alunos <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <form
        action="/analytics/acessos"
        key={JSON.stringify(filtros)}
        className="rounded-2xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Filter size={16} aria-hidden="true" />
          Refinar participação
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Marca
            <select name="marca" aria-label="Marca" defaultValue={filtros.marca} className={CAMPO}>
              {!restrito && (
                <>
                  <option value="">Todas as marcas</option>
                  <option value="sem-marca">Sem marca informada</option>
                </>
              )}
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Unidade
            <select
              name="unidade"
              aria-label="Unidade"
              defaultValue={filtros.unidade}
              className={CAMPO}
            >
              <option value="">Todas as unidades</option>
              <option value="sem-unidade">Sem unidade informada</option>
              {filtros.unidade &&
                filtros.unidade !== "sem-unidade" &&
                !unidadesDisponiveis.some((u) => u.id === filtros.unidade) && (
                  <option value={filtros.unidade}>Unidade fora deste recorte</option>
                )}
              {unidadesDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Perfil
            <select
              name="perfil"
              aria-label="Perfil"
              defaultValue={filtros.perfil}
              className={CAMPO}
            >
              <option value="">Todos os perfis</option>
              {Object.entries(PERFIS_ACESSO).map(([id, nome]) => (
                <option key={id} value={id}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Série
            <select
              name="serie"
              aria-label="Série"
              disabled={filtros.perfil !== "" && filtros.perfil !== "aluno"}
              defaultValue={filtros.serie}
              className={CAMPO}
            >
              <option value="">Todas as séries</option>
              {series.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            Período
            <select
              name="periodo"
              aria-label="Período"
              defaultValue={filtros.periodo}
              className={CAMPO}
            >
              {Object.entries(PERIODOS_ACESSO).map(([id, nome]) => (
                <option key={id} value={id}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-auto h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Aplicar filtros
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            {PERIODOS_ACESSO[filtros.periodo]} · atualizado em{" "}
            {agora.toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
          <Link
            href="/analytics/acessos"
            className="font-medium text-primary underline underline-offset-4"
          >
            Limpar filtros
          </Link>
        </div>
      </form>

      <section
        aria-label="Indicadores de acesso"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
      >
        {indicadores.map(({ nome, valor, detalhe, Icone }) => (
          <article key={nome} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-5 text-muted-foreground">{nome}</p>
              <Icone size={16} className="shrink-0 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{numero(valor)}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{detalhe}</p>
          </article>
        ))}
      </section>

      {recorte.length === 0 ? (
        <Secao
          titulo="Nenhum cadastro neste recorte"
          descricao="Ajuste os filtros para consultar outras unidades, séries ou perfis."
        >
          <Link
            href="/analytics/acessos"
            className="text-sm font-semibold text-primary underline underline-offset-4"
          >
            Consultar os cadastros disponíveis
          </Link>
        </Secao>
      ) : (
        <>
          <Secao
            titulo="Do acesso ao estudo"
            descricao="Somente perfis identificados como alunos, no mesmo recorte e período."
          >
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  titulo: "Alunos cadastrados",
                  valor: baseAlunos,
                  cor: "bg-primary",
                  detalhe: "base de alunos deste recorte",
                },
                {
                  titulo: "Alunos com acesso",
                  valor: resumo.alunos.pessoas,
                  cor: "bg-sky-500",
                  detalhe: "com login, sessão ou estudo registrado",
                },
                {
                  titulo: "Alunos com estudo",
                  valor: resumo.alunos.estudantes,
                  cor: "bg-emerald-500",
                  detalhe: "com respostas ou progresso positivo em aulas",
                },
              ].map((item) => (
                <div key={item.titulo}>
                  <p className="text-sm text-muted-foreground">{item.titulo}</p>
                  <div className="my-2 flex items-baseline gap-2">
                    <p className="text-3xl font-bold tabular-nums">{numero(item.valor)}</p>
                    <span className="text-xs text-muted-foreground">
                      {percentual(item.valor, baseAlunos)}
                    </span>
                  </div>
                  <Barra valor={item.valor} base={baseAlunos} cor={item.cor} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {numero(item.valor)} de {numero(baseAlunos)} · {item.detalhe}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              <GraduationCap size={16} className="shrink-0 text-primary" aria-hidden="true" />
              <p>
                {baseAlunos
                  ? `${numero(baseAlunos - resumo.alunos.pessoas)} aluno(s) sem acesso registrado no período; ${numero(resumo.alunos.pessoas - resumo.alunos.estudantes)} com acesso e sem estudo registrado.`
                  : "O recorte selecionado não inclui alunos identificados."}{" "}
                <Link
                  href={desempenhoHref}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Abrir acompanhamento pedagógico
                </Link>
              </p>
            </div>
          </Secao>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Secao
              titulo="Participação por perfil"
              descricao="A mesma conta institucional é contada uma vez entre portal e gestão."
            >
              <dl className="space-y-5">
                {resumo.porPerfil.map((p) => (
                  <div key={p.perfil}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <dt>{p.nome}</dt>
                      <dd className="text-right text-xs tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{numero(p.pessoas)}</span>{" "}
                        com acesso · {numero(p.sessoes)} sessões
                      </dd>
                    </div>
                    <Barra valor={p.pessoas} base={p.cadastros} cor="bg-primary" />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {numero(p.pessoas)} de {numero(p.cadastros)} cadastros ·{" "}
                      {percentual(p.pessoas, p.cadastros)}
                    </p>
                  </div>
                ))}
              </dl>
            </Secao>
            <Secao
              titulo="Alunos por série"
              descricao="Inclui as séries do Ensino Fundamental e do Ensino Médio presentes no recorte."
            >
              {resumo.porSerie.length ? (
                <dl className="space-y-4">
                  {resumo.porSerie.map((s) => (
                    <div
                      key={s.serie}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between gap-3 text-sm">
                        <dt className="font-medium">{s.serie}</dt>
                        <dd className="text-right text-xs tabular-nums text-muted-foreground">
                          {numero(s.pessoas)} de {numero(s.cadastros)} com acesso ·{" "}
                          {numero(s.sessoes)} sessões
                        </dd>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {numero(s.estudantes)} com estudo registrado
                      </p>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno identificado neste recorte.
                </p>
              )}
            </Secao>
          </div>

          <Secao
            titulo="Participação por marca e unidade"
            descricao="Compare a cobertura de acesso e de estudo. Os cadastros sem atividade também aparecem."
          >
            <div
              className="overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-primary"
              tabIndex={0}
              role="region"
              aria-label="Comparação de participação por unidade"
            >
              <table
                className="w-full min-w-[760px] text-left text-sm"
                aria-label="Participação por marca e unidade"
              >
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    {[
                      "Marca / unidade",
                      "Cadastros",
                      "Pessoas com acesso",
                      "Sessões",
                      "Alunos com estudo",
                    ].map((titulo, i) => (
                      <th
                        key={titulo}
                        scope="col"
                        className={`px-4 py-3 font-medium ${i ? "text-right" : ""}`}
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resumo.grupos.map((g) => (
                    <tr
                      key={JSON.stringify([g.marcaId, g.unidadeId])}
                      className="hover:bg-muted/20"
                    >
                      <th scope="row" className="px-4 py-4 font-normal">
                        <p className="font-semibold">{g.unidade}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{g.marca}</p>
                      </th>
                      <td className="px-4 py-4 text-right tabular-nums">{numero(g.cadastros)}</td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        <p className="font-semibold">{numero(g.pessoas)}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {percentual(g.pessoas, g.cadastros)} dos cadastros
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">{numero(g.sessoes)}</td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        <p className="font-semibold">
                          {numero(g.estudantes)} de {numero(g.alunos)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {percentual(g.estudantes, g.alunos)} dos alunos
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Secao>
        </>
      )}

      <details
        className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
        open
      >
        <summary className="cursor-pointer font-semibold text-foreground">
          Como interpretar os indicadores
        </summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed">
          <p>
            Pessoas com acesso contam cada conta institucional uma vez no período. O histórico usa
            os logins disponíveis; o estudo registrado também comprova acesso. Esses indicadores não
            representam pessoas online.
          </p>
          <p>
            Uma nova sessão começa após 30 minutos sem atividade. Recargas, abas e troca entre
            portal e gestão não criam sessões extras nesse intervalo. Sessões contam pelo início;
            uma sessão iniciada antes do período pode manter uma pessoa ativa nele.
          </p>
          <p>
            {resumo.medicao
              ? `As primeiras sessões deste conjunto foram registradas em ${new Date(resumo.medicao).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
              : "As sessões serão contabilizadas a partir dos próximos acessos coletados."}{" "}
            Logins antigos não são convertidos em sessões.
          </p>
          <p>
            Novos cadastros incluem importações e não significam primeiro acesso. Ativos em 7 e 30
            dias usam sempre essas janelas, mantendo os demais filtros.
          </p>
          <p>
            Estudo considera respostas e progresso positivo ou conclusão registrada de aula. Acesso
            e sessão não comprovam presença em encontros, vídeos assistidos ou tempo efetivo de
            estudo.
          </p>
          <p>
            O perfil e os vínculos confirmados no portal classificam o histórico. Contas com acesso
            à gestão sem perfil confirmado no portal aparecem como equipe; os demais registros sem
            perfil confirmado ficam como pendentes.
          </p>
        </div>
      </details>
    </div>
  );
}
