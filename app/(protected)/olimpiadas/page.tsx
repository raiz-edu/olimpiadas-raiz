import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleOlimpiadaAtivo } from "./actions";

export const metadata = { title: "Olimpíadas — Olimpíadas" };

const CLASSIFICACAO_LABELS: Record<string, string> = {
  obrigatoria: "Obrigatória",
  facultativa: "Facultativa",
};

const CLASSIFICACAO_COLORS: Record<string, string> = {
  obrigatoria: "bg-secondary text-foreground",
  facultativa: "bg-secondary text-muted-foreground",
};

export default async function OlimpiadasPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  const { data: olimpiadas } = await supabase
    .from("olimpiada")
    .select("id, nome, area_conhecimento, classificacao, ano_letivo, ativo")
    .order("ano_letivo", { ascending: false })
    .order("nome");

  type OlimpiadaRow = NonNullable<typeof olimpiadas>[number];

  return (
    <div className="space-y-6">
      <Can role={user.role} perform="olimpiada:create" fallback={<PageHeader title="Olimpíadas" />}>
        <PageHeader
          title="Olimpíadas"
          description="Catálogo de olimpíadas do conhecimento"
          action={{ label: "Nova olimpíada", href: "/olimpiadas/nova" }}
        />
      </Can>

      {!olimpiadas || olimpiadas.length === 0 ? (
        <EmptyState
          title="Nenhuma olimpíada cadastrada"
          description="Crie a primeira olimpíada para começar."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          }
          action={{ label: "Nova olimpíada", href: "/olimpiadas/nova" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Olimpíada</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Área
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Classificação
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Ano
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(olimpiadas as OlimpiadaRow[]).map((o) => (
                <tr key={o.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/olimpiadas/${o.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {o.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {o.area_conhecimento}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${CLASSIFICACAO_COLORS[o.classificacao] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {CLASSIFICACAO_LABELS[o.classificacao] ?? o.classificacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {o.ano_letivo}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge ativo={o.ativo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/olimpiadas/${o.id}`}
                        className="rounded px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-secondary"
                      >
                        Ver
                      </Link>
                      <Can role={user.role} perform="olimpiada:update">
                        <Link
                          href={`/olimpiadas/${o.id}/editar`}
                          className="rounded px-2 py-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          Editar
                        </Link>
                        <form action={toggleOlimpiadaAtivo}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="ativo" value={String(o.ativo)} />
                          {o.ativo ? (
                            <ConfirmButton
                              message={`Desativar a olimpíada "${o.nome}"?`}
                              className="rounded px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-secondary"
                            >
                              Desativar
                            </ConfirmButton>
                          ) : (
                            <button
                              type="submit"
                              className="rounded px-2 py-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                            >
                              Ativar
                            </button>
                          )}
                        </form>
                      </Can>
                    </div>
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
