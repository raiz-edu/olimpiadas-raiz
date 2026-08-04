import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/form-field";
import { getServerSession } from "@/lib/auth/session";
import { can, podeGerirApostilas } from "@/lib/auth/roles";
import { getNomeModulo, getReceitas } from "@/lib/apostilas/queries";
import Link from "next/link";
import { salvarNomeModulo } from "./actions";

export const dynamic = "force-dynamic";

// gerado_em é timestamptz completo — new Date() é seguro aqui (o gotcha de
// parseDateLocal vale só para strings date-only).
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function ApostilasPage() {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "apostila:read")) redirect("/dashboard");
  const gestor = podeGerirApostilas(session.user.role, session.user.email);

  const [nomeModulo, receitas] = await Promise.all([getNomeModulo(), getReceitas()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={nomeModulo}
        description="Receitas de apostila e histórico de produção a partir do banco de questões."
        action={gestor ? { label: "Nova receita", href: "/academico/apostilas/nova" } : undefined}
      />

      {gestor && (
        <form
          action={salvarNomeModulo}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <label htmlFor="nome_modulo" className="text-xs font-medium text-gray-500">
            Nome do módulo (menu e título):
          </label>
          <input
            id="nome_modulo"
            name="nome_modulo"
            defaultValue={nomeModulo}
            className={`${inputClass} w-56`}
          />
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          >
            Salvar nome
          </button>
        </form>
      )}

      {receitas.length === 0 ? (
        <EmptyState
          title="Nenhuma receita ainda"
          description="Crie a primeira receita para montar uma apostila a partir do acervo publicado."
          action={gestor ? { label: "Nova receita", href: "/academico/apostilas/nova" } : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Receita</th>
                <th className="px-4 py-3 hidden sm:table-cell">Título</th>
                <th className="px-4 py-3">Última geração</th>
                <th className="px-4 py-3 hidden md:table-cell">Questões</th>
                <th className="px-4 py-3 hidden md:table-cell">Déficit</th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((r) => {
                const deficit = r.ultima?.balanco?.reduce((s, l) => s + (l.deficit ?? 0), 0) ?? 0;
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/academico/apostilas/${r.id}`} className="hover:underline">
                        {r.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{r.titulo}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.ultima ? fmtData(r.ultima.gerado_em) : "nunca gerada"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.ultima?.total_questoes ?? "-"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.ultima ? (
                        deficit > 0 ? (
                          <span className="font-semibold text-red-600">{deficit}</span>
                        ) : (
                          <span className="text-emerald-600">0</span>
                        )
                      ) : (
                        "-"
                      )}
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
