/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDashboardAluno, getUltimasErradas } from "../actions";

const OLIMPIADA_LABEL: Record<string, string> = { obmep_mirim: "OBMEP Mirim", obmep: "OBMEP" };
const TEAL = "rgb(91,184,193)";

function PctBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-card overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function pctColor(pct: number) {
  if (pct >= 70) return "#4ade80";
  if (pct >= 50) return "#fbbf24";
  return "#f87171";
}

export default async function TreinoDashboardPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const [dashboard, erradas] = await Promise.all([getDashboardAluno(), getUltimasErradas(8)]);
  const { total, acertos, por_olimpiada, por_assunto } = dashboard as any;
  const erros = total - acertos;
  const pctAcerto = total > 0 ? Math.round((acertos / total) * 100) : null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Meu Desempenho</h1>
        <Link
          href="/aluno/treino"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0f172a]"
          style={{ background: TEAL }}
        >
          Continuar treinando
        </Link>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não respondeu nenhuma questão.</p>
          <Link href="/aluno/treino" className="text-sm font-semibold" style={{ color: TEAL }}>
            Começar agora →
          </Link>
        </div>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-black text-foreground">{total}</div>
              <div className="text-xs text-muted-foreground mt-1">Respondidas</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-black text-emerald-400">{acertos}</div>
              <div className="text-xs text-muted-foreground mt-1">Acertos</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-black text-red-400">{erros}</div>
              <div className="text-xs text-muted-foreground mt-1">Erros</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-black" style={{ color: pctColor(pctAcerto ?? 0) }}>
                {pctAcerto}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Taxa de acerto</div>
            </div>
          </div>

          {/* Por assunto — seção principal */}
          {por_assunto?.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Desempenho por Assunto</h2>
                <span className="text-xs text-muted-foreground">
                  Ordenado do mais fraco ao mais forte
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {por_assunto.map((row: any) => {
                  const pA = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
                  const pE = 100 - pA;
                  const cor = pctColor(pA);
                  return (
                    <div key={row.assunto} className="px-5 py-4">
                      <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-medium text-foreground">{row.assunto}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">
                            {row.total} {row.total === 1 ? "questão" : "questões"}
                          </span>
                          <span className="font-bold text-emerald-400">{pA}% acerto</span>
                          <span className="font-bold text-red-400">{pE}% erro</span>
                        </div>
                      </div>
                      {/* Barra dupla: acerto (esquerda) + erro (direita) */}
                      <div
                        className="h-2 rounded-full overflow-hidden flex gap-0.5"
                        style={{ background: "#1e293b" }}
                      >
                        {pA > 0 && (
                          <div
                            className="h-full rounded-l-full"
                            style={{ width: `${pA}%`, background: cor }}
                          />
                        )}
                        {pE > 0 && (
                          <div
                            className="h-full rounded-r-full"
                            style={{ width: `${pE}%`, background: "#f87171" }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Por olimpíada */}
          {por_olimpiada?.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Por Olimpíada</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="px-5 py-3 text-left font-semibold">Olimpíada</th>
                      <th className="px-5 py-3 text-right font-semibold">Questões</th>
                      <th className="px-5 py-3 text-right font-semibold text-emerald-400">
                        Acerto
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-red-400">Erro</th>
                      <th className="px-5 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {por_olimpiada.map((row: any) => {
                      const pA = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
                      return (
                        <tr key={row.olimpiada} className="border-b border-border/40">
                          <td className="px-5 py-3 font-medium">
                            {OLIMPIADA_LABEL[row.olimpiada] ?? row.olimpiada}
                          </td>
                          <td className="px-5 py-3 text-right text-muted-foreground">
                            {row.total}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">{pA}%</td>
                          <td className="px-5 py-3 text-right font-bold text-red-400">
                            {100 - pA}%
                          </td>
                          <td className="px-5 py-3">
                            <PctBar pct={pA} color={pctColor(pA)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimas erradas */}
          {erradas.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Questões para revisar</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="px-5 py-3 text-left font-semibold">Olimpíada</th>
                      <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">
                        Fase · Ano
                      </th>
                      <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">
                        Assunto
                      </th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {erradas.map((r: any) => (
                      <tr key={r.questao_id} className="border-b border-border/40">
                        <td className="px-5 py-3">
                          {OLIMPIADA_LABEL[r.questao?.olimpiada] ?? r.questao?.olimpiada}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                          {r.questao?.fase}ª Fase · {r.questao?.ano}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                          {r.questao?.assunto ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/aluno/treino/${r.questao_id}`}
                            className="text-xs font-semibold"
                            style={{ color: TEAL }}
                          >
                            Revisar →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
