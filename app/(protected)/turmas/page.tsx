import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleTurmaAtivo } from "./actions";

export const metadata = { title: "Turmas — Olimpíadas" };

export default async function TurmasPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  const { data: turmas } = await supabase
    .from("turma")
    .select(
      "id, nome, ano_letivo, serie, ativo, unidade_id, unidade:unidade_id(nome, marca:marca_id(nome, cor_primaria))",
    )
    .order("nome");

  type TurmaRow = NonNullable<typeof turmas>[number];

  return (
    <div className="space-y-6">
      <Can role={user.role} perform="turma:create" fallback={<PageHeader title="Turmas" />}>
        <PageHeader
          title="Turmas"
          description="Turmas vinculadas às unidades de ensino"
          action={{ label: "Nova turma", href: "/turmas/nova" }}
        />
      </Can>

      {!turmas || turmas.length === 0 ? (
        <EmptyState
          title="Nenhuma turma encontrada"
          description="Crie a primeira turma para começar."
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          action={{ label: "Nova turma", href: "/turmas/nova" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Turma</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Unidade
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Série
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Ano letivo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(turmas as TurmaRow[]).map((t) => {
                const unidade = Array.isArray(t.unidade) ? t.unidade[0] : t.unidade;
                const marca =
                  unidade &&
                  (Array.isArray((unidade as { marca: unknown }).marca)
                    ? (
                        (unidade as { marca: unknown[] }).marca as {
                          nome: string;
                          cor_primaria: string | null;
                        }[]
                      )[0]
                    : (unidade as { marca: { nome: string; cor_primaria: string | null } | null })
                        .marca);

                return (
                  <tr key={t.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {unidade && (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          {marca && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  (marca as { cor_primaria: string | null }).cor_primaria ??
                                  "#6b7280",
                              }}
                              aria-hidden="true"
                            />
                          )}
                          {(unidade as { nome: string }).nome}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {t.serie ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {t.ano_letivo ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge ativo={t.ativo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Can role={user.role} perform="turma:update">
                          <Link
                            href={`/turmas/${t.id}/editar`}
                            className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-blue-50"
                          >
                            Editar
                          </Link>
                          <form action={toggleTurmaAtivo}>
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="ativo" value={String(t.ativo)} />
                            {t.ativo ? (
                              <ConfirmButton
                                message={`Desativar a turma "${t.nome}"?`}
                                className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
                              >
                                Desativar
                              </ConfirmButton>
                            ) : (
                              <button
                                type="submit"
                                className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-blue-50"
                              >
                                Ativar
                              </button>
                            )}
                          </form>
                        </Can>
                      </div>
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
