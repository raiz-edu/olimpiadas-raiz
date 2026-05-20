import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { confirmarInscricao, cancelarInscricao } from "./actions";

export const metadata = { title: "Inscrições — Olimpíadas" };

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-yellow-50 text-yellow-700",
  confirmada: "bg-green-50  text-green-700",
  cancelada: "bg-red-50    text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

type SearchParams = { olimpiada?: string; status?: string };

export default async function InscricoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const sp = await searchParams;
  const supabase = createAdminClient();

  // Filtros
  const filterOlimpiada = sp.olimpiada ?? "";
  const filterStatus = sp.status ?? "";

  let query = supabase
    .from("v_dashboard_inscricoes")
    .select("*")
    .order("inscrito_em", { ascending: false });

  if (filterOlimpiada) query = query.eq("olimpiada_id", filterOlimpiada);
  if (filterStatus)
    query = query.eq("status", filterStatus as "pendente" | "confirmada" | "cancelada");

  const [{ data: inscricoes }, { data: olimpiadas }] = await Promise.all([
    query,
    supabase.from("olimpiada").select("id, nome, ano_letivo").eq("ativo", true).order("nome"),
  ]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <Can role={user.role} perform="inscricao:create" fallback={<PageHeader title="Inscrições" />}>
        <PageHeader
          title="Inscrições"
          description="Inscrições de alunos em olimpíadas"
          action={{ label: "Nova inscrição", href: "/inscricoes/nova" }}
        />
      </Can>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        <select
          name="olimpiada"
          defaultValue={filterOlimpiada}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas as olimpíadas</option>
          {(olimpiadas ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} ({o.ano_letivo})
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={filterStatus}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <button
          type="submit"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-200"
        >
          Filtrar
        </button>

        {(filterOlimpiada || filterStatus) && (
          <Link href="/inscricoes" className="text-sm text-muted-foreground hover:text-foreground">
            Limpar filtros
          </Link>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {inscricoes?.length ?? 0} {inscricoes?.length === 1 ? "inscrição" : "inscrições"}
        </span>
      </form>

      {!inscricoes || inscricoes.length === 0 ? (
        <EmptyState
          title="Nenhuma inscrição encontrada"
          description={
            filterOlimpiada || filterStatus
              ? "Tente mudar os filtros."
              : "Crie a primeira inscrição para começar."
          }
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
          action={{ label: "Nova inscrição", href: "/inscricoes/nova" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Turma / Unidade
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Olimpíada
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Inscrito em
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inscricoes.map((i) => (
                <tr key={i.inscricao_id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{i.aluno_nome}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-foreground">{i.serie}</span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">{i.unidade_nome}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-foreground">{i.olimpiada_nome}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({i.ano_letivo})</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatDate(i.inscrito_em)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[i.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[i.status] ?? i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Can role={user.role} perform="inscricao:update">
                        {i.status === "pendente" && (
                          <form action={confirmarInscricao}>
                            <input type="hidden" name="id" value={i.inscricao_id} />
                            <button
                              type="submit"
                              className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                              Confirmar
                            </button>
                          </form>
                        )}
                        {i.status !== "cancelada" && (
                          <form action={cancelarInscricao}>
                            <input type="hidden" name="id" value={i.inscricao_id} />
                            <ConfirmButton
                              message={`Cancelar a inscrição de ${i.aluno_nome} em ${i.olimpiada_nome}?`}
                              className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              Cancelar
                            </ConfirmButton>
                          </form>
                        )}
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
