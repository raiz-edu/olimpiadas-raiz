import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { salvarResultado, removerResultado } from "./actions";

export const metadata = { title: "Resultados — Olimpíadas" };

// ---------------------------------------------------------------------------
// Constantes de display
// ---------------------------------------------------------------------------

const TIPO_RESULTADO_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  nao_aprovado: "Não aprovado",
  ouro: "Ouro 🥇",
  prata: "Prata 🥈",
  bronze: "Bronze 🥉",
  mencao_honrosa: "Menção Honrosa",
};

const TIPO_RESULTADO_STYLE: Record<string, string> = {
  aprovado: "bg-green-50  text-green-700",
  nao_aprovado: "bg-red-50    text-red-600",
  ouro: "bg-yellow-50 text-yellow-700",
  prata: "bg-slate-50  text-slate-600",
  bronze: "bg-orange-50 text-orange-700",
  mencao_honrosa: "bg-blue-50   text-blue-700",
};

const TIPO_FASE_LABEL: Record<string, string> = {
  inscricao: "Inscrição",
  prova_1: "Prova 1",
  prova_2: "Prova 2",
  final: "Final",
  divulgacao: "Divulgação",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SearchParams = { olimpiada?: string; fase?: string };

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const sp = await searchParams;
  const filterOlimpiada = sp.olimpiada ?? "";
  const filterFase = sp.fase ?? "";
  const canWrite = can(user.role, "resultado:create");

  const supabase = createAdminClient();

  // Olimpíadas para o filtro
  const { data: olimpiadas } = await supabase
    .from("olimpiada")
    .select("id, nome, ano_letivo")
    .eq("ativo", true)
    .order("nome");

  // Fases da olimpíada selecionada
  const { data: fases } = filterOlimpiada
    ? await supabase
        .from("olimpiada_fase")
        .select("id, nome, tipo, data_inicio, data_fim, ordem")
        .eq("olimpiada_id", filterOlimpiada)
        .order("ordem")
    : { data: null };

  // Buscar inscrições + resultados para a fase selecionada
  type InscricaoComResultado = {
    id: string;
    status: string;
    aluno: { id: string; nome: string } | null;
    turma: { nome: string; serie: string; unidade: { nome: string } | null } | null;
    resultado: {
      id: string;
      tipo: string;
      pontuacao: number | null;
      observacoes: string | null;
    } | null;
  };

  let inscricoesComResultado: InscricaoComResultado[] = [];

  if (filterOlimpiada && filterFase) {
    // Buscar inscrições confirmadas + pendentes da olimpíada
    const { data: inscricoes } = await supabase
      .from("inscricao")
      .select("id, status, aluno_id, aluno:aluno_id(id, nome)")
      .eq("olimpiada_id", filterOlimpiada)
      .in("status", ["pendente", "confirmada"])
      .order("aluno_id");

    // Buscar resultados existentes para esta fase
    const { data: resultados } = await supabase
      .from("resultado")
      .select("id, inscricao_id, tipo, pontuacao, observacoes")
      .eq("fase_id", filterFase);

    const resultadoMap = new Map((resultados ?? []).map((r) => [r.inscricao_id, r]));

    inscricoesComResultado = (inscricoes ?? []).map((insc) => {
      const aluno = Array.isArray(insc.aluno) ? insc.aluno[0] : insc.aluno;
      return {
        id: insc.id,
        status: insc.status,
        aluno: aluno as { id: string; nome: string } | null,
        turma: null,
        resultado: resultadoMap.get(insc.id) ?? null,
      };
    });
  }

  // Buscar dados de alunos/turmas separadamente para a visualização
  type AlunoInfo = {
    id: string;
    nome: string;
    turma_nome: string;
    serie: string;
    unidade_nome: string;
  };
  const alunoInfoMap = new Map<string, AlunoInfo>();

  if (filterOlimpiada && filterFase && inscricoesComResultado.length > 0) {
    const alunoIds = inscricoesComResultado
      .map((i) => i.aluno?.id)
      .filter((id): id is string => Boolean(id));

    if (alunoIds.length > 0) {
      const { data: alunosData } = await supabase
        .from("aluno")
        .select("id, nome, turma:turma_id(nome, serie, unidade:unidade_id(nome))")
        .in("id", alunoIds);

      for (const a of alunosData ?? []) {
        const turma = Array.isArray(a.turma) ? a.turma[0] : a.turma;
        const unidade = turma
          ? Array.isArray((turma as { unidade: unknown }).unidade)
            ? ((turma as { unidade: unknown[] }).unidade as { nome: string }[])[0]
            : (turma as { unidade: { nome: string } | null }).unidade
          : null;
        alunoInfoMap.set(a.id, {
          id: a.id,
          nome: a.nome,
          turma_nome: turma ? (turma as { nome: string }).nome : "—",
          serie: turma ? (turma as { serie: string }).serie : "—",
          unidade_nome: unidade ? (unidade as { nome: string }).nome : "—",
        });
      }
    }
  }

  const faseSelecionada = (fases ?? []).find((f) => f.id === filterFase);

  // Contadores
  const totalAlunos = inscricoesComResultado.length;
  const totalComResultado = inscricoesComResultado.filter((i) => i.resultado).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultados"
        description="Registre e consulte resultados por fase de olimpíada"
      />

      {/* Filtros em cascata */}
      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor="sel-olimpiada"
            className="block text-xs font-medium text-muted-foreground"
          >
            Olimpíada
          </label>
          <select
            id="sel-olimpiada"
            name="olimpiada"
            defaultValue={filterOlimpiada}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecione…</option>
            {(olimpiadas ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} ({o.ano_letivo})
              </option>
            ))}
          </select>
        </div>

        {filterOlimpiada && fases && fases.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="sel-fase" className="block text-xs font-medium text-muted-foreground">
              Fase
            </label>
            <select
              id="sel-fase"
              name="fase"
              defaultValue={filterFase}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecione…</option>
              {fases.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ordem}. {f.nome} — {TIPO_FASE_LABEL[f.tipo] ?? f.tipo}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-200"
        >
          Ver resultados
        </button>

        {filterOlimpiada && fases && fases.length === 0 && (
          <p className="text-sm text-amber-600 self-center">
            Esta olimpíada não tem fases.{" "}
            <Link href={`/olimpiadas/${filterOlimpiada}`} className="underline">
              Adicionar →
            </Link>
          </p>
        )}
      </form>

      {/* Conteúdo principal */}
      {!filterOlimpiada && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Selecione uma olimpíada para ver os resultados.
          </p>
        </div>
      )}

      {filterOlimpiada && !filterFase && fases && fases.length > 0 && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Selecione uma fase para registrar os resultados.
          </p>
        </div>
      )}

      {filterOlimpiada && filterFase && (
        <>
          {/* Cabeçalho da fase */}
          {faseSelecionada && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {TIPO_FASE_LABEL[faseSelecionada.tipo] ?? faseSelecionada.tipo}
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground">
                  {faseSelecionada.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(faseSelecionada.data_inicio)} – {formatDate(faseSelecionada.data_fim)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{totalComResultado}</p>
                <p className="text-xs text-muted-foreground">de {totalAlunos} registrados</p>
                {totalAlunos > 0 && (
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${Math.round((totalComResultado / totalAlunos) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabela de resultados */}
          {inscricoesComResultado.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                Nenhum aluno inscrito nesta olimpíada.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <Link href="/inscricoes/nova" className="text-primary underline">
                  Realizar inscrições
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Turma / Unidade
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Resultado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Pontuação
                    </th>
                    {canWrite && (
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Registrar
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inscricoesComResultado.map((insc) => {
                    const info = insc.aluno ? alunoInfoMap.get(insc.aluno.id) : null;
                    const res = insc.resultado;

                    return (
                      <tr key={insc.id} className="hover:bg-background/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {info?.nome ?? insc.aluno?.nome ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-foreground">{info?.turma_nome ?? "—"}</span>
                          {info?.unidade_nome && (
                            <span className="text-muted-foreground"> · {info.unidade_nome}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {res ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_RESULTADO_STYLE[res.tipo] ?? "bg-secondary text-muted-foreground"}`}
                            >
                              {TIPO_RESULTADO_LABEL[res.tipo] ?? res.tipo}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Pendente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {res?.pontuacao != null ? res.pontuacao : "—"}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3">
                            <Can role={user.role} perform="resultado:create">
                              <ResultadoInlineForm
                                inscricaoId={insc.id}
                                faseId={filterFase}
                                resultado={res}
                              />
                            </Can>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente de form inline (Server Component — renderiza o form, action no server)
// ---------------------------------------------------------------------------

function ResultadoInlineForm({
  inscricaoId,
  faseId,
  resultado,
}: {
  inscricaoId: string;
  faseId: string;
  resultado: {
    id: string;
    tipo: string;
    pontuacao: number | null;
    observacoes: string | null;
  } | null;
}) {
  const tipos: { value: string; label: string }[] = [
    { value: "aprovado", label: "Aprovado" },
    { value: "nao_aprovado", label: "Não aprovado" },
    { value: "ouro", label: "🥇 Ouro" },
    { value: "prata", label: "🥈 Prata" },
    { value: "bronze", label: "🥉 Bronze" },
    { value: "mencao_honrosa", label: "Menção Honrosa" },
  ];

  return (
    <form action={salvarResultado} className="flex items-center justify-end gap-2 flex-wrap">
      {resultado && <input type="hidden" name="resultado_id" value={resultado.id} />}
      <input type="hidden" name="inscricao_id" value={inscricaoId} />
      <input type="hidden" name="fase_id" value={faseId} />

      <select
        name="tipo"
        defaultValue={resultado?.tipo ?? ""}
        className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-blue-500 focus:outline-none"
      >
        <option value="" disabled>
          Tipo…
        </option>
        {tipos.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <input
        name="pontuacao"
        type="number"
        step="0.01"
        min={0}
        defaultValue={resultado?.pontuacao ?? ""}
        placeholder="Pts"
        className="w-16 rounded border border-border px-2 py-1 text-xs text-foreground focus:border-blue-500 focus:outline-none"
      />

      <button
        type="submit"
        className="rounded bg-blue-700 px-2 py-1 text-xs font-medium text-white hover:bg-blue-800"
      >
        {resultado ? "Atualizar" : "Salvar"}
      </button>

      {resultado && (
        <form action={removerResultado} className="inline">
          <input type="hidden" name="id" value={resultado.id} />
          <button
            type="submit"
            className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            ✕
          </button>
        </form>
      )}
    </form>
  );
}
