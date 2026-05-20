import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleAlunoAtivo } from "@/app/(protected)/alunos/actions";
import { getAnoAnalise } from "@/lib/auth/ano-analise";
import type { RoleUsuario } from "@/lib/types/database";

export const metadata = { title: "Escolas — Olimpíadas" };

type Aba = "unidades" | "alunos";

// ---------------------------------------------------------------------------
// TabNav
// ---------------------------------------------------------------------------

function TabNav({ aba, userRole }: { aba: Aba; userRole: RoleUsuario }) {
  const tabs: { id: Aba; label: string; perm: Parameters<typeof can>[1] }[] = [
    { id: "unidades", label: "Rede Escolar", perm: "unidade:read" },
    { id: "alunos", label: "Alunos", perm: "aluno:read" },
  ];

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) =>
        can(userRole, tab.perm) ? (
          <Link
            key={tab.id}
            href={`?aba=${tab.id}`}
            className={`px-4 py-2.5 text-sm transition-colors ${
              aba === tab.id
                ? "border-b-2 border-primary -mb-px font-medium text-foreground"
                : "border-b-2 border-transparent -mb-px text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ) : null,
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function EscolaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  const sp = await searchParams;
  const abaParam = sp["aba"];
  const aba: Aba = abaParam === "alunos" ? "alunos" : "unidades";
  const busca = typeof sp["busca"] === "string" ? sp["busca"].trim() : "";
  const anoSelecionado = await getAnoAnalise();

  // ---------------------------------------------------------------------------
  // Fetch condicional
  // ---------------------------------------------------------------------------

  // Marcas com contagem de unidades e turmas
  const marcas =
    aba === "unidades" && can(user.role, "unidade:read")
      ? (
          await supabase
            .from("marca")
            .select("id, nome, unidades:unidade(id, turmas:turma(id, ano_letivo))")
            .order("nome")
        ).data
      : null;

  // Alunos com busca opcional
  const alunosQuery = (() => {
    if (aba !== "alunos" || !can(user.role, "aluno:read")) return null;
    let q = supabase
      .from("aluno")
      .select(
        "id, nome, data_nascimento, ativo, turma_id, turma:turma_id(nome, serie, ano_letivo, unidade:unidade_id(nome, marca:marca_id(nome)))",
      )
      .order("nome");
    if (busca) q = q.ilike("nome", `%${busca}%`);
    return q;
  })();
  const alunosBrutos = alunosQuery ? (await alunosQuery).data : null;
  const alunos =
    alunosBrutos?.filter((a) => {
      const t = Array.isArray(a.turma) ? a.turma[0] : a.turma;
      return t && (t as { ano_letivo?: number | null }).ano_letivo === anoSelecionado;
    }) ?? alunosBrutos;

  // ---------------------------------------------------------------------------
  // Contagem por marca
  // ---------------------------------------------------------------------------

  const marcaRows = (marcas ?? []).map((m) => {
    const unidadeList = (Array.isArray(m.unidades) ? m.unidades : []) as {
      id: string;
      turmas: { id: string; ano_letivo: number | null }[] | null;
    }[];
    const numUnidades = unidadeList.length;
    const numTurmas = unidadeList.reduce((acc, u) => {
      const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as {
        id: string;
        ano_letivo: number | null;
      }[];
      return acc + turmas.filter((t) => t.ano_letivo === anoSelecionado).length;
    }, 0);
    return { id: m.id, nome: m.nome, numUnidades, numTurmas };
  });

  // ---------------------------------------------------------------------------
  // Botões "Nova X"
  // ---------------------------------------------------------------------------

  const novoButton =
    aba === "unidades" ? (
      <div className="flex items-center gap-2">
        {can(user.role, "unidade:create") && (
          <Link
            href="/unidades/nova"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            + Nova unidade
          </Link>
        )}
        {can(user.role, "turma:create") && (
          <Link
            href="/turmas/nova"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Nova turma
          </Link>
        )}
      </div>
    ) : aba === "alunos" && can(user.role, "aluno:create") ? (
      <Link
        href="/alunos/novo"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        + Novo aluno
      </Link>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Escolas</h1>
        {novoButton}
      </div>

      {/* Tabs */}
      <TabNav aba={aba} userRole={user.role} />

      {/* ------------------------------------------------------------------ */}
      {/* ABA UNIDADES & TURMAS                                                */}
      {/* ------------------------------------------------------------------ */}
      {aba === "unidades" && (
        <>
          {marcaRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma marca encontrada.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Unidades
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Turmas
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {marcaRows.map((m) => (
                    <tr key={m.id} className="hover:bg-background/50">
                      <td className="px-4 py-3 text-muted-foreground">{m.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.numUnidades}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.numTurmas}</td>
                      <td className="px-4 py-3 text-muted-foreground">{anoSelecionado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA ALUNOS                                                           */}
      {/* ------------------------------------------------------------------ */}
      {aba === "alunos" && (
        <>
          {/* Busca */}
          <form method="GET" className="flex items-center gap-3">
            <input type="hidden" name="aba" value="alunos" />
            <div className="relative max-w-sm flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                name="busca"
                type="text"
                defaultValue={busca}
                placeholder="Buscar aluno..."
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            {busca && (
              <Link
                href="?aba=alunos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar
              </Link>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {alunos?.length ?? 0} {(alunos?.length ?? 0) === 1 ? "aluno" : "alunos"}
            </span>
          </form>

          {!alunos || alunos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {busca ? `Nenhum aluno encontrado para "${busca}".` : "Nenhum aluno cadastrado."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%] hidden md:table-column" />
                  <col className="w-[13%]" />
                  <col className="w-[9%] hidden sm:table-column" />
                  <col className="w-[8%] hidden sm:table-column" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Turma</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Série
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Ano
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {alunos.map((a) => {
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
                        ? ((unidade as { marca: unknown[] }).marca as { nome: string }[])[0]
                        : (unidade as { marca: { nome: string } | null }).marca);

                    return (
                      <tr key={a.id} className="hover:bg-background/50">
                        <td className="px-4 py-3 text-muted-foreground">{a.nome}</td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {marca ? (marca as { nome: string }).nome : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {unidade ? (unidade as { nome: string }).nome : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {turma ? (turma as { nome: string }).nome : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {turma ? ((turma as { serie?: string | null }).serie ?? "—") : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {turma
                            ? ((turma as { ano_letivo?: number | null }).ano_letivo ?? "—")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {can(user.role, "aluno:update") && (
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/alunos/${a.id}/editar`}
                                className="rounded px-2 py-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                              >
                                Editar
                              </Link>
                              <form action={toggleAlunoAtivo}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="ativo" value={String(a.ativo)} />
                                {a.ativo ? (
                                  <ConfirmButton
                                    message={`Desativar o aluno "${a.nome}"?`}
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
                            </div>
                          )}
                        </td>
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
