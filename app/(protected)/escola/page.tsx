import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { toggleUnidadeAtivo } from "@/app/(protected)/unidades/actions";
import { toggleTurmaAtivo } from "@/app/(protected)/turmas/actions";
import { toggleAlunoAtivo } from "@/app/(protected)/alunos/actions";
import type { RoleUsuario } from "@/lib/types/database";

export const metadata = { title: "Escola — Olimpíadas" };

type Aba = "unidades" | "turmas" | "alunos";

// ---------------------------------------------------------------------------
// TabNav
// ---------------------------------------------------------------------------

function TabNav({ aba, userRole }: { aba: Aba; userRole: RoleUsuario }) {
  const tabs: { id: Aba; label: string; perm: Parameters<typeof can>[1] }[] = [
    { id: "unidades", label: "Unidades", perm: "unidade:read" },
    { id: "turmas", label: "Turmas", perm: "turma:read" },
    { id: "alunos", label: "Alunos", perm: "aluno:read" },
  ];

  return (
    <div className="flex border-b border-border mb-6">
      {tabs.map((tab) =>
        can(userRole, tab.perm) ? (
          <Link
            key={tab.id}
            href={`?aba=${tab.id}`}
            className={`px-4 py-2.5 text-sm ${
              aba === tab.id
                ? "border-b-2 border-primary -mb-px font-medium text-foreground"
                : "border-b-2 border-transparent -mb-px text-muted-foreground hover:text-foreground transition-colors"
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
  const aba: Aba = abaParam === "turmas" ? "turmas" : abaParam === "alunos" ? "alunos" : "unidades";

  // Fetch condicional da aba ativa
  const unidades =
    aba === "unidades" && can(user.role, "unidade:read")
      ? (
          await supabase
            .from("unidade")
            .select("id, nome, cidade, estado, ativo, marca_id, marca:marca_id(nome, cor_primaria)")
            .order("nome")
        ).data
      : null;

  const turmas =
    aba === "turmas" && can(user.role, "turma:read")
      ? (
          await supabase
            .from("turma")
            .select("id, nome, ano_letivo, serie, ativo, unidade_id, unidade:unidade_id(nome)")
            .order("nome")
        ).data
      : null;

  const alunos =
    aba === "alunos" && can(user.role, "aluno:read")
      ? (
          await supabase
            .from("aluno")
            .select(
              "id, nome, data_nascimento, ativo, turma_id, turma:turma_id(nome, unidade:unidade_id(nome))",
            )
            .order("nome")
        ).data
      : null;

  // Computed rows for unidades (agrupamento por marca)
  const unidadesSorted = [...(unidades ?? [])].sort(
    (a, b) =>
      getMarcaNome(a.marca).localeCompare(getMarcaNome(b.marca)) || a.nome.localeCompare(b.nome),
  );
  const unidadeRows = unidadesSorted.map((u, i) => {
    const marcaNome = getMarcaNome(u.marca);
    const prevMarcaNome = i > 0 ? getMarcaNome(unidadesSorted[i - 1]?.marca) : null;
    return { ...u, marcaNome, isFirstInGroup: marcaNome !== prevMarcaNome };
  });

  // Botão "Nova X" por aba
  const novoButton =
    aba === "unidades" && can(user.role, "unidade:create") ? (
      <Link
        href="/unidades/nova"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        + Nova unidade
      </Link>
    ) : aba === "turmas" && can(user.role, "turma:create") ? (
      <Link
        href="/turmas/nova"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        + Nova turma
      </Link>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Escola</h1>
        {novoButton}
      </div>

      <TabNav aba={aba} userRole={user.role} />

      {/* ------------------------------------------------------------------ */}
      {/* ABA UNIDADES                                                         */}
      {/* ------------------------------------------------------------------ */}
      {aba === "unidades" && (
        <>
          {!unidades || unidades.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[27%]" />
                  <col className="w-[23%] hidden sm:table-column" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Localização
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadeRows.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-background/50 border-b border-border${u.isFirstInGroup && idx > 0 ? " border-t-2 border-t-border/60" : ""}`}
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
                        {can(user.role, "unidade:update") && (
                          <div className="flex items-center gap-2">
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
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA TURMAS                                                           */}
      {/* ------------------------------------------------------------------ */}
      {aba === "turmas" && (
        <>
          {!turmas || turmas.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[30%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                </colgroup>
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
                      Ano
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {turmas.map((t) => {
                    const unidade = Array.isArray(t.unidade) ? t.unidade[0] : t.unidade;
                    return (
                      <tr key={t.id} className="hover:bg-background/50">
                        <td className="px-4 py-3 font-bold text-foreground">{t.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {unidade ? (unidade as { nome: string }).nome : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {t.serie ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {t.ano_letivo ?? "—"}
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
                    );
                  })}
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
          {!alunos || alunos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[30%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Turma
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                      Nascimento
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
                            (turma as { unidade: { nome: string }[] }).unidade as { nome: string }[]
                          )[0]
                        : (turma as { unidade: { nome: string } | null }).unidade);

                    return (
                      <tr key={a.id} className="hover:bg-background/50">
                        <td className="px-4 py-3 font-bold text-foreground">{a.nome}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {turma ? (
                            <span className="text-muted-foreground">
                              {(turma as { nome: string }).nome}
                              {unidade && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {(unidade as { nome: string }).nome}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {formatDate(a.data_nascimento)}
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
