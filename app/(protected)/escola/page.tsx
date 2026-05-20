import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleTurmaAtivo } from "@/app/(protected)/turmas/actions";
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
// Helpers
// ---------------------------------------------------------------------------

const getMarcaNome = (m: unknown): string => {
  const obj = (Array.isArray(m) ? m[0] : m) as { nome?: string } | null | undefined;
  return obj?.nome ?? "—";
};

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

  // Unidades + turmas aninhadas
  const unidades =
    aba === "unidades" && can(user.role, "unidade:read")
      ? (
          await supabase
            .from("unidade")
            .select(
              "id, nome, cidade, estado, ativo, marca_id, marca:marca_id(nome), turmas:turma(id, nome, serie, ano_letivo, ativo)",
            )
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
  // Agrupamento de unidades por marca
  // ---------------------------------------------------------------------------

  type Turma = {
    id: string;
    nome: string;
    serie: string | null;
    ano_letivo: number | null;
    ativo: boolean;
  };

  const unidadesSorted = [...(unidades ?? [])].sort(
    (a, b) =>
      getMarcaNome(a.marca).localeCompare(getMarcaNome(b.marca)) || a.nome.localeCompare(b.nome),
  );

  const unidadeRows = unidadesSorted.map((u) => {
    const marcaNome = getMarcaNome(u.marca);
    const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as Turma[];
    const turmasFiltradas = turmas.filter((t) => t.ano_letivo === anoSelecionado);
    const turmasSorted = [...turmasFiltradas].sort((a, b) => a.nome.localeCompare(b.nome));
    return { ...u, marcaNome, turmasSorted };
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
          {!unidades || unidades.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma unidade encontrada.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[20%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%] hidden sm:table-column" />
                  <col className="w-[8%] hidden sm:table-column" />
                  <col className="w-[18%] hidden sm:table-column" />
                  <col className="w-[17%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Turma</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Série
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Ano
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Localização
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unidadeRows.flatMap((u) =>
                    u.turmasSorted.map((t) => (
                      <tr key={`t-${t.id}`} className="hover:bg-background/50">
                        <td className="px-4 py-3 text-muted-foreground">{u.marcaNome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {t.serie ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {t.ano_letivo ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {u.cidade && u.estado
                            ? `${u.cidade} / ${u.estado}`
                            : (u.cidade ?? u.estado ?? "—")}
                        </td>
                        <td className="px-4 py-3">
                          {can(user.role, "turma:update") && (
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/turmas/${t.id}/editar`}
                                className="rounded px-2 py-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                              >
                                Editar
                              </Link>
                              <form action={toggleTurmaAtivo}>
                                <input type="hidden" name="id" value={t.id} />
                                <input type="hidden" name="ativo" value={String(t.ativo)} />
                                {t.ativo ? (
                                  <ConfirmButton
                                    message={`Desativar a turma "${t.nome}"?`}
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
                    )),
                  )}
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
