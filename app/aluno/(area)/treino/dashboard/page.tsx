/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDashboardAluno, getQuestoesRanking } from "../actions";
import type { QuestaoRankEntry, TopicoRankEntry } from "../actions";

const TEAL = "rgb(91,184,193)";

function pctColor(pct: number) {
  if (pct >= 70) return "#4ade80";
  if (pct >= 50) return "#fbbf24";
  return "#f87171";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function posStyle(pos: number) {
  if (pos === 1)
    return { cls: "text-amber-400 border-amber-400/40 bg-amber-400/10", barCls: "bg-amber-400" };
  if (pos === 2)
    return { cls: "text-zinc-300 border-zinc-400/40 bg-zinc-400/10", barCls: "bg-zinc-400" };
  if (pos === 3)
    return {
      cls: "text-orange-400 border-orange-500/40 bg-orange-500/10",
      barCls: "bg-orange-500",
    };
  return {
    cls: "text-muted-foreground border-border bg-muted/20",
    barCls: "bg-muted-foreground/40",
  };
}

const OLIMP_LABEL: Record<string, string> = { obmep: "OBMEP", obmep_mirim: "Mirim" };
const NIVEL_SHORT: Record<string, string> = {
  nivel_1: "N1",
  nivel_2: "N2",
  nivel_3: "N3",
  mirim: "Mirim",
};

function labelQuestao(q: QuestaoRankEntry): string {
  const olimp = OLIMP_LABEL[q.olimpiada] ?? q.olimpiada.toUpperCase();
  const nivel = q.nivel ? (NIVEL_SHORT[q.nivel] ?? q.nivel) : null;
  const fase = q.fase ? `${q.fase}ª Fase` : null;
  return [olimp, nivel, fase, q.ano, `Q${q.numero}`].filter(Boolean).join(" · ");
}

// ── Componentes ───────────────────────────────────────────────────────────────

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

function RankingItem({
  pos,
  item,
  campo,
  max,
}: {
  pos: number;
  item: QuestaoRankEntry;
  campo: "erros" | "acertos";
  max: number;
}) {
  const count = item[campo];
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const { cls, barCls } = posStyle(pos);
  const topico = item.topico ?? item.assunto;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Posição */}
      <span
        className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-black tabular-nums ${cls}`}
      >
        #{pos}
      </span>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground truncate">
            {labelQuestao(item)}
          </span>
          <span
            className={`shrink-0 text-xs font-black tabular-nums ${campo === "erros" ? "text-red-400" : "text-emerald-400"}`}
          >
            {count}
            {campo === "erros" ? "×" : "✓"}
          </span>
        </div>
        {/* Barra */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barCls}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {topico && (
          <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            {topico}
          </span>
        )}
      </div>
    </div>
  );
}

function TopicosDerived({
  topicos,
  tipo,
}: {
  topicos: TopicoRankEntry[];
  tipo: "revisar" | "forte";
}) {
  if (!topicos.length) return null;
  const max = topicos[0]?.peso ?? 1;
  return (
    <div className="border-t border-border/50 px-4 py-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {tipo === "revisar" ? "Tópicos a revisar" : "Tópicos fortes"}
      </p>
      {topicos.map((t, i) => {
        const pct = Math.round((t.peso / max) * 100);
        return (
          <div key={t.topico} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-bold tabular-nums ${i === 0 ? "text-amber-400" : "text-muted-foreground"}`}
                >
                  {i + 1}.
                </span>
                <span className="text-xs font-medium text-foreground truncate">{t.topico}</span>
              </div>
              {tipo === "revisar" ? (
                <Link
                  href={`/aluno/treino?topico=${encodeURIComponent(t.topico)}&modo=aleatorio`}
                  className="shrink-0 text-[10px] font-semibold transition-colors"
                  style={{ color: TEAL }}
                >
                  Treinar →
                </Link>
              ) : (
                <span className="shrink-0 text-[10px] text-emerald-400 font-bold">{t.peso}✓</span>
              )}
            </div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${tipo === "revisar" ? "bg-red-400/70" : "bg-emerald-400/70"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingCard({
  titulo,
  subtitulo,
  itens,
  campo,
  topicos,
  tipo,
  vazio,
}: {
  titulo: string;
  subtitulo: string;
  itens: QuestaoRankEntry[];
  campo: "erros" | "acertos";
  topicos: TopicoRankEntry[];
  tipo: "revisar" | "forte";
  vazio: string;
}) {
  const max = itens.length > 0 ? (itens[0]?.[campo] ?? 1) : 1;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-bold text-foreground">{titulo}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitulo}</p>
      </div>

      {itens.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground italic">{vazio}</p>
      ) : (
        <>
          <div className="divide-y divide-border/40">
            {itens.map((item, i) => (
              <RankingItem key={item.questao_id} pos={i + 1} item={item} campo={campo} max={max} />
            ))}
          </div>
          <TopicosDerived topicos={topicos} tipo={tipo} />
        </>
      )}
    </div>
  );
}

// ── Simulados (sem alterações) ─────────────────────────────────────────────────

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

function PctBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: pctColor(pct) }}
      />
    </div>
  );
}

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
                  {["Simulado", "Data", "Questões", "Acertos", "Score", "Tempo"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-[11px] font-medium text-muted-foreground ${h === "Simulado" ? "text-left" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {porSimulado.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0;
                  return (
                    <tr key={s.aula_id}>
                      <td className="px-4 py-3 font-medium text-foreground">{s.titulo}</td>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TreinoDashboardPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const [dashboard, ranking] = await Promise.all([getDashboardAluno(), getQuestoesRanking()]);

  const { total_geral, acertos_geral, simulados } = dashboard as any;
  const pctGeral = total_geral > 0 ? Math.round((acertos_geral / total_geral) * 100) : null;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground">Desempenho</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/aluno/treino?favoritas=1"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Favoritas
          </Link>
          <Link
            href="/aluno/treino"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0f172a]"
            style={{ background: TEAL }}
          >
            Continuar treinando
          </Link>
        </div>
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

          {/* Ranking de questões — dois painéis */}
          {(ranking.maisErradas.length > 0 || ranking.maisAcertadas.length > 0) && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ranking de questões
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <RankingCard
                  titulo="Pontos Fortes"
                  subtitulo="Questões mais acertadas"
                  itens={ranking.maisAcertadas}
                  campo="acertos"
                  topicos={ranking.topicosMaisAcertados}
                  tipo="forte"
                  vazio="Responda questões para ver seus pontos fortes."
                />
                <RankingCard
                  titulo="Pontos a Revisar"
                  subtitulo="Questões com mais erros acumulados"
                  itens={ranking.maisErradas}
                  campo="erros"
                  topicos={ranking.topicosMaisErrados}
                  tipo="revisar"
                  vazio="Nenhuma questão errada ainda — bom sinal!"
                />
              </div>
            </section>
          )}

          {/* Sessão de Revisão */}
          {ranking.maisErradas.length > 0 && (
            <section>
              <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Sessão de Revisão</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Crônicos + recentes · repetição espaçada 2-3-5-7-15 dias
                  </p>
                </div>
                <Link
                  href="/aluno/treino?erradas=1"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-[#0f172a] whitespace-nowrap"
                  style={{ background: TEAL }}
                >
                  Revisar agora
                </Link>
              </div>
            </section>
          )}

          {/* Simulados */}
          {(simulados as any)?.total > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Simulados
              </h2>
              <SecaoSimulados
                total={(simulados as any).total}
                acertos={(simulados as any).acertos}
                porTopico={(simulados as any).por_topico ?? []}
                porSimulado={(simulados as any).por_simulado ?? []}
              />
            </section>
          )}

          {/* Banco / Listas — resumo compacto */}
        </>
      )}
    </div>
  );
}
