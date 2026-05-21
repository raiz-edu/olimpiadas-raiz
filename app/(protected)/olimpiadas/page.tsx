import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarcaMultiSelect } from "@/components/olimpiadas/marca-multi-select";
import {
  OlimpiadaMultiSelect,
  OLIMPIADAS_NACIONAIS,
} from "@/components/olimpiadas/olimpiada-multi-select";

export const metadata = { title: "Olimpíadas — Olimpíadas" };

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-400",
  confirmada: "bg-emerald-500/10 text-emerald-400",
  cancelada: "bg-red-500/10 text-red-400",
};

export default async function OlimpiadasPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; olimpiada?: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const sp = await searchParams;

  const marcaParam = sp.marca ?? "todas";
  const olimpiadaParam = sp.olimpiada ?? "todas";

  const marcaTodosMode = marcaParam === "todas";
  const olimpiadaTodosMode = olimpiadaParam === "todas";

  const selectedMarcas = marcaTodosMode ? [] : marcaParam.split(",").filter(Boolean);
  const selectedOlimpiadas = olimpiadaTodosMode ? [] : olimpiadaParam.split(",").filter(Boolean);

  const { data: marcas } = await supabase.from("marca").select("id, nome").order("nome");

  let query = supabase
    .from("v_dashboard_inscricoes")
    .select(
      "inscricao_id, aluno_nome, olimpiada_nome, area_conhecimento, marca_nome, unidade_nome, serie, status, ano_letivo, inscrito_em",
    )
    .order("inscrito_em", { ascending: false })
    .limit(200);

  if (!marcaTodosMode && selectedMarcas.length > 0) {
    query = query.in("marca_nome", selectedMarcas);
  }
  if (!olimpiadaTodosMode && selectedOlimpiadas.length > 0) {
    const conditions = selectedOlimpiadas.map((s) => `olimpiada_nome.ilike.%${s}%`).join(",");
    query = query.or(conditions);
  }

  const { data: inscricoes } = await query;
  const total = inscricoes?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olimpíadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Participação por marca e competição</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Marca */}
        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Marca
          </p>
          <MarcaMultiSelect
            marcas={marcas ?? []}
            selected={selectedMarcas}
            todosMode={marcaTodosMode}
          />
        </div>

        {/* Olimpíada */}
        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Olimpíada
          </p>
          <OlimpiadaMultiSelect selected={selectedOlimpiadas} todosMode={olimpiadaTodosMode} />
        </div>
      </div>

      {/* Referência */}
      <details className="group rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          <span>
            Olimpíadas do conhecimento — referência nacional ({OLIMPIADAS_NACIONAIS.length})
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 transition-transform group-open:rotate-180"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="border-t border-border px-5 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OLIMPIADAS_NACIONAIS.map((o) => (
              <div
                key={o.sigla}
                className="flex items-start gap-2.5 rounded-lg border border-border/50 px-3 py-2.5"
              >
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: "rgba(91,184,193,0.12)", color: "rgb(91,184,193)" }}
                >
                  {o.sigla}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{o.nome}</p>
                  <p className="text-xs text-muted-foreground">{o.nivel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Contador */}
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? "Nenhuma inscrição encontrada."
          : total >= 200
            ? "Exibindo as 200 inscrições mais recentes."
            : `${total} inscrição${total !== 1 ? "ões" : ""} encontrada${total !== 1 ? "s" : ""}.`}
      </p>

      {/* Tabela */}
      {total > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Aluno
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-medium sm:table-cell"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Olimpíada
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-medium md:table-cell"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Marca
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-medium lg:table-cell"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Unidade
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-medium sm:table-cell"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Série
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-medium sm:table-cell"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Ano
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(inscricoes ?? []).map((i) => (
                <tr key={i.inscricao_id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{i.aluno_nome}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {i.olimpiada_nome}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {i.marca_nome}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {i.unidade_nome}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {i.serie ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {i.ano_letivo}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[i.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[i.status] ?? i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
