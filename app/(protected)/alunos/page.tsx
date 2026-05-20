import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleAlunoAtivo } from "./actions";

export const metadata = { title: "Alunos — Olimpíadas" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function AlunosPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  const { data: alunos } = await supabase
    .from("aluno")
    .select(
      "id, nome, data_nascimento, cpf, ativo, turma_id, turma:turma_id(nome, unidade:unidade_id(nome, marca:marca_id(cor_primaria)))",
    )
    .order("nome");

  type AlunoRow = NonNullable<typeof alunos>[number];

  return (
    <div className="space-y-6">
      <Can role={user.role} perform="aluno:create" fallback={<PageHeader title="Alunos" />}>
        <PageHeader
          title="Alunos"
          description="Alunos cadastrados nas turmas"
          action={{ label: "Novo aluno", href: "/alunos/novo" }}
        />
      </Can>

      {!alunos || alunos.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description="Cadastre o primeiro aluno para começar."
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          action={{ label: "Novo aluno", href: "/alunos/novo" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Aluno</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">
                  Turma
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">
                  Nascimento
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(alunos as AlunoRow[]).map((a) => {
                const turma = Array.isArray(a.turma) ? a.turma[0] : a.turma;
                const unidade =
                  turma &&
                  (Array.isArray((turma as { unidade: unknown }).unidade)
                    ? (
                        (turma as { unidade: unknown[] }).unidade as {
                          nome: string;
                          marca: unknown;
                        }[]
                      )[0]
                    : (turma as { unidade: { nome: string; marca: unknown } | null }).unidade);
                const marca =
                  unidade &&
                  (Array.isArray((unidade as { marca: unknown }).marca)
                    ? (
                        (unidade as { marca: unknown[] }).marca as { cor_primaria: string | null }[]
                      )[0]
                    : (unidade as { marca: { cor_primaria: string | null } | null }).marca);

                return (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {turma && (
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
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
                          {(turma as { nome: string }).nome}
                          {unidade && (
                            <span className="text-gray-400">
                              · {(unidade as { nome: string }).nome}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(a.data_nascimento)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge ativo={a.ativo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Can role={user.role} perform="aluno:update">
                          <Link
                            href={`/alunos/${a.id}/editar`}
                            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Editar
                          </Link>
                          <form action={toggleAlunoAtivo}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="ativo" value={String(a.ativo)} />
                            {a.ativo ? (
                              <ConfirmButton
                                message={`Desativar o aluno "${a.nome}"?`}
                                className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                              >
                                Desativar
                              </ConfirmButton>
                            ) : (
                              <button
                                type="submit"
                                className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
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
