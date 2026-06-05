import Link from "next/link";
import { getSimulados } from "./actions";

function fmtData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function SimuladosPage() {
  const simulados = await getSimulados();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Simulados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie simulados independentes ou vinculados a projetos
          </p>
        </div>
        <Link
          href="/academico/simulados/novo"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          + Novo simulado
        </Link>
      </div>

      {simulados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Nenhum simulado criado ainda.{" "}
          <Link href="/academico/simulados/novo" className="text-primary underline">
            Criar o primeiro
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vinculação
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {simulados.map((s) => {
                const temProjetos = (s.projeto_ids?.length ?? 0) > 0 || s.projeto_id != null;
                const temSeries = (s.series_elegiveis?.length ?? 0) > 0;

                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/academico/simulados/${s.id}`} className="hover:underline">
                        {s.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {fmtData(s.data_hora)}
                    </td>
                    <td className="px-4 py-3">
                      {temProjetos ? (
                        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400">
                          {(s.projeto_ids?.length ?? 0) + (s.projeto_id ? 1 : 0)} projeto
                          {(s.projeto_ids?.length ?? 0) + (s.projeto_id ? 1 : 0) !== 1 ? "s" : ""}
                        </span>
                      ) : temSeries ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          {s.series_elegiveis.length} série
                          {s.series_elegiveis.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem vínculo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.publicada ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          Publicado
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          Rascunho
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/academico/simulados/${s.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
