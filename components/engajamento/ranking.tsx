import Link from "next/link";
import { Trophy } from "lucide-react";
import {
  montarAlunosEngajamento,
  type DadosEngajamento,
  type JanelaEstudo,
} from "@/lib/engajamento/metricas";
import { catalogoRecortes, recorteIdentificado } from "@/lib/engajamento/recortes";
import {
  filtrarRanking,
  montarRankingPreparacao,
  urlRanking,
  type FiltrosRanking,
} from "@/lib/engajamento/ranking";
import { FiltrosQuestoes } from "./filtros-questoes";
import { NavegacaoPedagogica } from "./navegacao";

const CAMPO =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const CARTAO = "min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5";
const numero = (valor: number) => valor.toLocaleString("pt-BR");
const POR_PAGINA = 25;

export function PainelRanking({
  dados,
  filtros,
  janela,
}: {
  dados: DadosEngajamento;
  filtros: FiltrosRanking;
  janela: JanelaEstudo;
}) {
  const catalogo = catalogoRecortes(dados);
  const marcas = [...dados.marcas].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const marca = marcas.find((m) => m.id === filtros.marca);
  const completo = Boolean(marca && recorteIdentificado(catalogo, filtros));
  const incompleto = !filtros.marca || !filtros.olimpiada || !filtros.nivel || !filtros.fase;
  const linhas = completo ? montarRankingPreparacao(dados, janela, filtros) : [];
  const visiveis = filtrarRanking(linhas, filtros);
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const pagina = Math.min(filtros.pagina, paginas);
  const exibidos = visiveis.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const alunosDaMarca = montarAlunosEngajamento(
    { ...dados, respostas: [], progressos: [] },
    janela,
  ).filter((a) => a.marcaId === filtros.marca);
  const unidades = [
    ...new Map(alunosDaMarca.map((a) => [a.unidadeId ?? "sem-vinculo", a.unidade])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const data = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(iso));
  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-teal-300">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Preparação olímpica
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ranking por marca</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Reconheça a preparação dos alunos entre as unidades de uma marca, por olimpíada, nível e
            fase.
          </p>
        </div>
        <p className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {data(janela.inicio)} a {data(janela.fim)}
        </p>
      </header>
      <NavegacaoPedagogica atual="ranking" filtros={filtros} />
      <form
        key={`recorte-${urlRanking(filtros)}`}
        action="/academico/ranking"
        aria-label="Definir ranking de preparação"
        className={`${CARTAO} grid gap-3 sm:grid-cols-2 xl:grid-cols-3`}
      >
        <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">
          Marca
          <select
            name="marca"
            aria-label="Marca"
            required
            defaultValue={filtros.marca}
            className={CAMPO}
          >
            <option value="">Selecione uma marca</option>
            {filtros.marca && !marca && <option value={filtros.marca}>Marca não encontrada</option>}
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <FiltrosQuestoes catalogo={catalogo} filtros={filtros} className={CAMPO} obrigatorio />
        <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">
          Período
          <select
            name="periodo"
            aria-label="Período"
            defaultValue={String(filtros.periodo)}
            className={CAMPO}
          >
            {[7, 30, 90].map((n) => (
              <option key={n} value={n}>
                Últimos {n} dias
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3">
          <button
            className="h-10 flex-1 rounded-lg bg-teal-300 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            type="submit"
          >
            Ver ranking
          </button>
          <Link
            href="/academico/ranking"
            className="rounded py-2 text-xs text-muted-foreground underline underline-offset-4"
          >
            Limpar
          </Link>
        </div>
      </form>

      {!completo ? (
        <section className={`${CARTAO} border-dashed`} aria-labelledby="ranking-selecao-titulo">
          <h2 id="ranking-selecao-titulo" className="font-semibold">
            {incompleto ? "Defina o recorte do ranking" : "Revise o recorte do ranking"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {incompleto
              ? "Selecione uma marca, olimpíada, nível e fase para consultar a preparação dos alunos."
              : "A combinação selecionada não está disponível. Escolha uma olimpíada e um nível e fase compatíveis."}
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                titulo: "Alunos confirmados da marca",
                valor: linhas.length,
                detalhe: "Inclui quem ainda não tem prática neste recorte",
              },
              {
                titulo: "Com acertos no período",
                valor: linhas.filter((a) => a.posicao !== null).length,
                detalhe: "Alunos com posição no ranking de preparação",
              },
              {
                titulo: "Questões acertadas",
                valor: linhas.reduce((soma, a) => soma + a.acertadas, 0),
                detalhe: "Soma das questões distintas acertadas por aluno",
              },
            ].map((item) => (
              <section key={item.titulo} aria-label={item.titulo} className={CARTAO}>
                <p className="text-xs text-muted-foreground">{item.titulo}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{numero(item.valor)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detalhe}</p>
              </section>
            ))}
          </div>
          <section className={CARTAO} aria-labelledby="ranking-alunos-titulo">
            <h2 id="ranking-alunos-titulo" className="text-sm font-semibold">
              Preparação dos alunos · {marca!.nome}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ordenado por questões distintas acertadas. Reconhece preparação e volume de prática,
              sem equivaler a uma nota de prova.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A posição é definida entre todas as unidades da marca no recorte escolhido. Unidade e
              busca apenas filtram a exibição, preservando as posições e os indicadores acima.
            </p>
            <form
              key={`alunos-${urlRanking(filtros)}`}
              action="/academico/ranking#ranking-alunos-titulo"
              aria-label="Filtrar alunos no ranking"
              className="my-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              {(["marca", "olimpiada", "nivel", "fase", "periodo"] as const).map((chave) => (
                <input key={chave} type="hidden" name={chave} value={String(filtros[chave])} />
              ))}
              <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">
                Unidade
                <select
                  name="unidade"
                  aria-label="Unidade"
                  defaultValue={filtros.unidade}
                  className={CAMPO}
                >
                  <option value="">Todas as unidades</option>
                  {filtros.unidade && !unidades.some(([id]) => id === filtros.unidade) && (
                    <option value={filtros.unidade}>Unidade não encontrada</option>
                  )}
                  {unidades.map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">
                Buscar aluno
                <input
                  name="busca"
                  type="search"
                  maxLength={120}
                  defaultValue={filtros.busca}
                  placeholder="Nome do aluno"
                  className={CAMPO}
                />
              </label>
              <button
                type="submit"
                className="h-10 self-end rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                Filtrar alunos
              </button>
            </form>
            {linhas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nenhum aluno confirmado nesta marca. Perfis ainda não confirmados estão disponíveis
                no painel de desempenho.
              </p>
            ) : visiveis.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nenhum aluno corresponde à unidade ou ao nome pesquisado.
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground sm:hidden">
                  Role para os lados para consultar todos os indicadores.
                </p>
                <div
                  className="overflow-x-auto rounded-xl border border-border"
                  role="region"
                  aria-label="Classificação de preparação por marca"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <caption className="sr-only">
                      Ranking de preparação dos alunos da marca no período selecionado
                    </caption>
                    <thead className="border-b border-border bg-background/50 text-xs text-muted-foreground">
                      <tr>
                        {[
                          "Posição",
                          "Aluno",
                          "Unidade",
                          "Questões acertadas",
                          "Questões respondidas",
                          "Acerto",
                          "Dias de prática",
                        ].map((titulo) => (
                          <th key={titulo} scope="col" className="px-4 py-3 font-medium">
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {exibidos.map((aluno) => (
                        <tr key={aluno.id} className="align-top hover:bg-background/20">
                          <td className="px-4 py-3 font-semibold tabular-nums text-teal-200">
                            {aluno.posicao === null ? (
                              <span className="font-normal text-muted-foreground">Sem posição</span>
                            ) : (
                              `${aluno.posicao}º`
                            )}
                          </td>
                          <th scope="row" className="px-4 py-3 font-medium">
                            {aluno.nome}
                            {aluno.serie && (
                              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                {aluno.serie}
                              </span>
                            )}
                          </th>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {aluno.unidade}
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {numero(aluno.acertadas)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {numero(aluno.respondidas)}
                            {aluno.pendentes > 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {numero(aluno.pendentes)} sem correção
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {aluno.corrigidas >= 5
                              ? `${Math.round((aluno.acertadas / aluno.corrigidas) * 100)}%`
                              : "—"}
                            <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                              {aluno.acertadas}/{aluno.corrigidas} corrigidas
                            </p>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{numero(aluno.diasPratica)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav
                  aria-label="Paginação do ranking"
                  className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
                >
                  <p>
                    {numero(visiveis.length)} aluno(s) no filtro · Página {pagina} de {paginas}
                  </p>
                  <div className="flex gap-2">
                    {pagina > 1 && (
                      <Link
                        className="rounded-lg border border-border px-4 py-3 font-medium text-foreground hover:bg-muted"
                        href={urlRanking(filtros, { pagina: pagina - 1 })}
                      >
                        Página anterior
                      </Link>
                    )}
                    {pagina < paginas && (
                      <Link
                        className="rounded-lg border border-border px-4 py-3 font-medium text-foreground hover:bg-muted"
                        href={urlRanking(filtros, { pagina: pagina + 1 })}
                      >
                        Próxima página
                      </Link>
                    )}
                  </div>
                </nav>
              </>
            )}
          </section>
        </>
      )}
      <details className={CARTAO}>
        <summary className="w-fit cursor-pointer rounded text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Como o ranking é calculado
        </summary>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>
            Acertos contam questões distintas no período. Basta uma tentativa com correção correta;
            repetir a mesma questão em treino, aula ou simulado não soma outro ponto.
          </li>
          <li>
            Empates compartilham a posição. Sem acertos, o aluno aparece sem posição. Questões ainda
            sem correção ficam fora do percentual, exibido a partir de 5 questões distintas
            corrigidas.
          </li>
          <li>
            Dias de prática contam dias com respostas, no horário de São Paulo. Quantidade de logins
            e aulas assistidas não define a posição.
          </li>
          <li>
            Este ranking reconhece preparação e volume de prática. Os alunos podem escolher questões
            de dificuldades diferentes; ele não equivale a uma classificação de prova ou premiação
            oficial.
          </li>
          <li>
            Participam somente alunos confirmados. A série exibida é cadastral; o nível selecionado
            pertence às questões e não altera elegibilidade para provas.
          </li>
        </ul>
      </details>
    </div>
  );
}
