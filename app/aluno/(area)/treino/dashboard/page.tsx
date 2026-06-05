/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDashboardAluno } from "../actions";

const TEAL = "rgb(91,184,193)";

function pctColor(pct: number) {
  if (pct >= 70) return "#4ade80";
  if (pct >= 50) return "#fbbf24";
  return "#f87171";
}

function PctBar({ pct, max = 100 }: { pct: number; max?: number }) {
  const w = Math.round((pct / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${w}%`, background: pctColor(pct) }}
      />
    </div>
  );
}

function ResumoCards({ total, acertos }: { total: number; acertos: number }) {
  const erros = total - acertos;
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Respondidas", value: total, cls: "text-foreground" },
        { label: "Acertos", value: acertos, cls: "text-emerald-400" },
        { label: "Erros", value: erros, cls: "text-red-400" },
        {
          label: "% Acerto",
          value: `${pct}%`,
          cls: pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400",
        },
      ].map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
          <p className={`text-2xl font-black ${c.cls}`}>{c.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Gráfico de barras horizontal ───────────────────────────────────────────── */
function GraficoTopicos({
  titulo,
  subtitulo,
  items,
  tipo,
}: {
  titulo: string;
  subtitulo: string;
  items: { topico: string; total: number; acertos: number; erros: number }[];
  tipo: "revisar" | "forte";
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitulo}</p>
      </div>
      <div className="divide-y divide-border/40">
        {items.map((row) => {
          const pct = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
          return (
            <div key={row.topico} className="px-5 py-3 space-y-1.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-foreground">{row.topico}</span>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-muted-foreground">{row.total}q</span>
                  <span className="font-bold text-emerald-400">{row.acertos}✓</span>
                  {row.erros > 0 && <span className="font-bold text-red-400">{row.erros}✗</span>}
                  <span className="font-bold w-8 text-right" style={{ color: pctColor(pct) }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <PctBar pct={pct} />
              {tipo === "revisar" && (
                <Link
                  href={`/aluno/treino?topico=${encodeURIComponent(row.topico)}&modo=aleatorio`}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: TEAL }}
                >
                  Treinar este tópico →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Seção de simulados (robusta) ───────────────────────────────────────────── */
function fmtTempo(seg: number) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function fmtData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

type SimuladoDetalhe = {
  aula_id: string;
  titulo: string;
  total: number;
  acertos: number;
  concluido_em: string | null;
  tempo_usado: number | null;
};

function SecaoSimulados({
  total,
  acertos,
  porTopico,
  porSimulado,
}: {
  total: number;
  acertos: number;
  porTopico: { topico: string; total: number; acertos: number; erros: number }[];
  porSimulado: SimuladoDetalhe[];
}) {
  const pctGeral = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const melhorPct =
    porSimulado.length > 0
      ? Math.max(
          ...porSimulado.map((s) => (s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0)),
        )
      : 0;

  return (
    <div className="space-y-5">
      {/* Header com resumo acumulado */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Simulados", value: porSimulado.length, cls: "text-foreground" },
          { label: "Questões", value: total, cls: "text-foreground" },
          {
            label: "% Geral",
            value: `${pctGeral}%`,
            cls:
              pctGeral >= 70
                ? "text-emerald-400"
                : pctGeral >= 50
                  ? "text-amber-400"
                  : "text-red-400",
          },
          {
            label: "Melhor score",
            value: `${melhorPct}%`,
            cls:
              melhorPct >= 70
                ? "text-emerald-400"
                : melhorPct >= 50
                  ? "text-amber-400"
                  : "text-red-400",
          },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-black ${c.cls}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela por simulado */}
      {porSimulado.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico de simulados
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-5 py-2 text-left text-[11px] font-medium text-muted-foreground">
                    Simulado
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Questões
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Acertos
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Tempo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {porSimulado.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0;
                  return (
                    <tr key={s.aula_id}>
                      <td className="px-5 py-3 font-medium text-foreground">{s.titulo}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums text-xs">
                        {fmtData(s.concluido_em)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{s.total}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-400">
                        {s.acertos}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold tabular-nums" style={{ color: pctColor(pct) }}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground text-xs tabular-nums">
                        {s.tempo_usado != null ? fmtTempo(s.tempo_usado) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desempenho por tópico acumulado */}
      {porTopico.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Desempenho por tópico — todos os simulados
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {porTopico.map((row) => {
              const p = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
              return (
                <div key={row.topico} className="px-5 py-3 space-y-1.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-foreground">{row.topico}</span>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-muted-foreground">{row.total}q</span>
                      <span className="font-bold text-emerald-400">{row.acertos}✓</span>
                      {row.erros > 0 && (
                        <span className="font-bold text-red-400">{row.erros}✗</span>
                      )}
                      <span className="font-bold w-8 text-right" style={{ color: pctColor(p) }}>
                        {p}%
                      </span>
                    </div>
                  </div>
                  <PctBar pct={p} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Seção por origem ───────────────────────────────────────────────────────── */
function SecaoOrigem({
  badge,
  badgeCls,
  total,
  acertos,
  porTopico,
}: {
  badge: string;
  badgeCls: string;
  total: number;
  acertos: number;
  porTopico: { topico: string; total: number; acertos: number; erros: number }[];
}) {
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
          {badge}
        </span>
        <span className="text-sm text-muted-foreground">
          {total} questões · {acertos} acertos ·{" "}
          <span style={{ color: pctColor(pct) }}>{pct}%</span>
        </span>
      </div>
      {porTopico.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border/40">
            {porTopico.map((row) => {
              const p = row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0;
              return (
                <div key={row.topico} className="px-5 py-3 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm text-foreground">{row.topico}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{row.total}q</span>
                      <span className="font-bold" style={{ color: pctColor(p) }}>
                        {p}%
                      </span>
                    </div>
                  </div>
                  <PctBar pct={p} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function TreinoDashboardPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const dashboard = await getDashboardAluno();
  const { total_geral, acertos_geral, banco, aulas, simulados } = dashboard as any;
  const pctGeral = total_geral > 0 ? Math.round((acertos_geral / total_geral) * 100) : null;

  // Agrega todos os tópicos (banco + aulas + simulados) para os gráficos
  const topicoMap: Record<
    string,
    { topico: string; total: number; acertos: number; erros: number }
  > = {};
  for (const t of banco?.por_topico ?? []) {
    if (!t.topico) continue;
    topicoMap[t.topico] = { topico: t.topico, total: t.total, acertos: t.acertos, erros: t.erros };
  }
  const todosTopicos = Object.values(topicoMap).filter((t) => t.total > 0);
  const topicosParaRevisar = [...todosTopicos]
    .sort((a, b) => a.acertos / a.total - b.acertos / b.total)
    .slice(0, 6);
  const topicosFortes = [...todosTopicos]
    .sort((a, b) => b.acertos / b.total - a.acertos / a.total)
    .slice(0, 4);

  return (
    <div className="max-w-3xl space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground">Meu Desempenho</h1>
        <Link
          href="/aluno/treino"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0f172a]"
          style={{ background: TEAL }}
        >
          Continuar treinando
        </Link>
      </div>

      {total_geral === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não respondeu nenhuma questão.</p>
          <Link href="/aluno/treino" className="text-sm font-semibold" style={{ color: TEAL }}>
            Começar agora →
          </Link>
        </div>
      ) : (
        <>
          {/* Resumo geral */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Geral — {total_geral} questões · {pctGeral}% de acerto
            </h2>
            <ResumoCards total={total_geral} acertos={acertos_geral} />
          </section>

          {/* Gráficos de tópicos */}
          {topicosParaRevisar.length > 0 && (
            <section className="grid gap-4 sm:grid-cols-2">
              <GraficoTopicos
                titulo="📚 Pontos a revisar"
                subtitulo="Tópicos com mais erros — clique para treinar"
                items={topicosParaRevisar}
                tipo="revisar"
              />
              {topicosFortes.length > 0 && (
                <GraficoTopicos
                  titulo="⭐ Pontos fortes"
                  subtitulo="Tópicos com melhor desempenho"
                  items={topicosFortes}
                  tipo="forte"
                />
              )}
            </section>
          )}

          {/* Simulados — seção dedicada */}
          {simulados?.total > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Simulados
              </h2>
              <SecaoSimulados
                total={simulados.total}
                acertos={simulados.acertos}
                porTopico={simulados.por_topico ?? []}
                porSimulado={(simulados as any).por_simulado ?? []}
              />
            </section>
          )}

          {/* Banco e Listas */}
          {(banco?.total > 0 || aulas?.total > 0) && (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Questões livres
              </h2>
              {banco?.total > 0 && (
                <SecaoOrigem
                  badge="Banco de Questões"
                  badgeCls="bg-sky-500/10 text-sky-400"
                  total={banco.total}
                  acertos={banco.acertos}
                  porTopico={banco.por_topico ?? []}
                />
              )}
              {aulas?.total > 0 && (
                <SecaoOrigem
                  badge="Listas de Questões"
                  badgeCls="bg-amber-500/10 text-amber-400"
                  total={aulas.total}
                  acertos={aulas.acertos}
                  porTopico={aulas.por_topico ?? []}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
