/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDashboardAluno, getUltimasErradas } from "../actions";

const OLIMPIADA_LABEL: Record<string, string> = { obmep_mirim: "OBMEP Mirim", obmep: "OBMEP" };

function PctBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div>
      <div className="h-1.5 rounded-full bg-card overflow-hidden mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default async function TreinoDashboardPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const [dashboard, erradas] = await Promise.all([getDashboardAluno(), getUltimasErradas(10)]);
  const { total, acertos, por_olimpiada } = dashboard as any;
  const pctGeral = total > 0 ? Math.round((acertos / total) * 100) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Meu Desempenho</h1>
        <Link href="/aluno/treino" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Continuar treinando
        </Link>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não respondeu nenhuma questão.</p>
          <Link href="/aluno/treino" className="text-primary hover:underline text-sm">
            Começar agora →
          </Link>
        </div>
      ) : (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-black text-foreground">{total}</div>
              <div className="text-xs text-muted-foreground mt-1">Respondidas</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className={`text-3xl font-black ${pctGeral! >= 70 ? "text-emerald-400" : pctGeral! >= 50 ? "text-amber-400" : "text-red-400"}`}>{pctGeral}%</div>
              <div className="text-xs text-muted-foreground mt-1">Taxa de acerto</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-black text-amber-400">{erradas.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Para revisar</div>
            </div>
          </div>

          {/* Por olimpíada */}
          {por_olimpiada?.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Por Olimpíada</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="px-5 py-3 text-left font-semibold">Olimpíada</th>
                    <th className="px-5 py-3 text-right font-semibold">Respondidas</th>
                    <th className="px-5 py-3 text-right font-semibold">Acertos</th>
                    <th className="px-5 py-3 text-right font-semibold">%</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {por_olimpiada.map((row: any) => {
                    const p = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
                    return (
                      <tr key={row.olimpiada} className="border-b border-border/40">
                        <td className="px-5 py-3 font-medium">{OLIMPIADA_LABEL[row.olimpiada] ?? row.olimpiada}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{row.total}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{row.acertos}</td>
                        <td className={`px-5 py-3 text-right font-bold ${p >= 70 ? "text-emerald-400" : p >= 50 ? "text-amber-400" : "text-red-400"}`}>{p}%</td>
                        <td className="px-5 py-3"><PctBar pct={p} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Últimas erradas */}
          {erradas.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Últimas erradas — revisar</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="px-5 py-3 text-left font-semibold">Olimpíada</th>
                    <th className="px-5 py-3 text-left font-semibold">Fase / Ano</th>
                    <th className="px-5 py-3 text-left font-semibold">Assunto</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {erradas.map((r: any) => (
                    <tr key={r.questao_id} className="border-b border-border/40">
                      <td className="px-5 py-3">{OLIMPIADA_LABEL[r.questao?.olimpiada] ?? r.questao?.olimpiada}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.questao?.fase}ª Fase · {r.questao?.ano}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.questao?.assunto ?? "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/aluno/treino/${r.questao_id}`} className="text-xs text-primary hover:underline">
                          Revisar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
