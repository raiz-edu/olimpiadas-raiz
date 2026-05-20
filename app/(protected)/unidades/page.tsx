import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleUnidadeAtivo } from "./actions";

export const metadata = { title: "Unidades — Olimpíadas" };

export default async function UnidadesPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  // RLS garante que o usuário só vê as unidades das suas marcas
  const { data: unidades } = await supabase
    .from("unidade")
    .select("id, nome, cidade, estado, ativo, marca_id, marca:marca_id(nome, cor_primaria)")
    .order("nome");

  const getMarcaNome = (m: unknown): string => {
    const obj = (Array.isArray(m) ? m[0] : m) as { nome?: string } | null | undefined;
    return obj?.nome ?? "—";
  };

  const sorted = [...(unidades ?? [])].sort(
    (a, b) =>
      getMarcaNome(a.marca).localeCompare(getMarcaNome(b.marca)) || a.nome.localeCompare(b.nome),
  );

  const rows = sorted.map((u, i) => {
    const marcaNome = getMarcaNome(u.marca);
    const prevMarcaNome = i > 0 ? getMarcaNome(sorted[i - 1]?.marca) : null;
    return { ...u, marcaNome, isFirstInGroup: marcaNome !== prevMarcaNome };
  });

  return (
    <div className="space-y-6">
      <Can role={user.role} perform="unidade:create" fallback={<PageHeader title="Unidades" />}>
        <PageHeader
          title="Unidades"
          description="Unidades de ensino vinculadas às marcas"
          action={{ label: "Nova unidade", href: "/unidades/nova" }}
        />
      </Can>

      {!unidades || unidades.length === 0 ? (
        <EmptyState
          title="Nenhuma unidade encontrada"
          description="Crie a primeira unidade para começar."
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          action={{ label: "Nova unidade", href: "/unidades/nova" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Localização
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-background/50 border-b border-border ${u.isFirstInGroup ? "border-t-2 border-t-border/60" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.isFirstInGroup ? u.marcaNome : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {u.cidade && u.estado
                      ? `${u.cidade} / ${u.estado}`
                      : (u.cidade ?? u.estado ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge ativo={u.ativo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Can role={user.role} perform="unidade:update">
                        <Link
                          href={`/unidades/${u.id}/editar`}
                          className="rounded px-2 py-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          Editar
                        </Link>
                        <form action={toggleUnidadeAtivo}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="ativo" value={String(u.ativo)} />
                          {u.ativo ? (
                            <ConfirmButton
                              message={`Desativar a unidade "${u.nome}"?`}
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
