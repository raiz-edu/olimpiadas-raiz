import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Início — Plataforma Olímpica" };

const TEAL = "rgb(91,184,193)";

function isLiveNow(dataHora: string | null) {
  if (!dataHora) return false;
  const d = new Date(dataHora);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs >= -3 * 60 * 60 * 1000 && diffMs <= 30 * 60 * 1000;
}

function isUpcoming(dataHora: string | null) {
  if (!dataHora) return false;
  const d = new Date(dataHora);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs > 30 * 60 * 1000 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function AlunoDashboard() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const admin = createAdminClient();
  const firstName = session.aluno.nome.split(" ")[0]!;

  const agora = new Date();
  const tresHAtras = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const seteDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [respostasResult, proximasAulasResult, proximoSimuladoResult] = await Promise.all([
    admin.from("resposta_aluno").select("correta").eq("aluno_id", session.aluno.id),
    // Aulas online das próximas 7 dias
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("preparacao_aula")
      .select("id, titulo, data_hora")
      .eq("tipo", "online")
      .eq("publicada", true)
      .gte("data_hora", tresHAtras.toISOString())
      .lte("data_hora", seteDias.toISOString())
      .order("data_hora")
      .limit(2),
    admin
      .from("preparacao_aula")
      .select("id, titulo, data_hora")
      .eq("tipo", "simulado")
      .eq("publicada", true)
      .gte("data_hora", agora.toISOString())
      .order("data_hora")
      .limit(1),
  ]);

  const respostas = respostasResult.data ?? [];
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.correta).length;
  const erros = total - acertos;
  const pct = total > 0 ? Math.round((acertos / total) * 100) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proximasAoVivo = ((proximasAulasResult as any).data ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => isLiveNow(a.data_hora) || isUpcoming(a.data_hora),
  );

  const proximoSimulado = proximoSimuladoResult.data?.[0] ?? null;

  const kpis = [
    { label: "Respondidas", value: total.toLocaleString("pt-BR"), cls: "text-foreground" },
    { label: "Acertos", value: acertos.toLocaleString("pt-BR"), cls: "text-emerald-400" },
    { label: "Erros", value: erros.toLocaleString("pt-BR"), cls: "text-red-400" },
    {
      label: "% Acerto",
      value: pct !== null ? `${pct}%` : "—",
      cls:
        pct === null
          ? "text-muted-foreground"
          : pct >= 70
            ? "text-emerald-400"
            : pct >= 50
              ? "text-amber-400"
              : "text-red-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Saudação + ação rápida */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta é a sua plataforma de preparação para as olimpíadas de conhecimento. Aproveite os
          projetos, simulados e questões. Não esqueça de acompanhar o seu desempenho e realizar as
          revisões. Boa preparação!
        </p>
      </div>

      {/* Snapshot de desempenho */}
      {total > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Seu desempenho
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <p className={`text-2xl font-black ${k.cls}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right">
            <Link
              href="/aluno/treino/dashboard"
              className="text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: TEAL }}
            >
              Ver desempenho completo →
            </Link>
          </div>
        </section>
      )}

      {/* Aulas ao vivo / próximas */}
      {proximasAoVivo.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Aulas ao vivo
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {proximasAoVivo.map((aula: any) => (
              <Link
                key={aula.id}
                href={`/aluno/aula/${aula.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-ring transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <svg
                    className="h-4 w-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.2" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{aula.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {isLiveNow(aula.data_hora) ? (
                      <span className="font-semibold text-red-500">AO VIVO AGORA</span>
                    ) : (
                      <>{fmtDateTime(aula.data_hora)}</>
                    )}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Próximo simulado */}
      {proximoSimulado && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próximo simulado
          </h2>
          <Link
            href="/aluno/simulados"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-ring transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <svg
                className="h-5 w-5 text-violet-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {proximoSimulado.titulo}
              </p>
              <p className="text-xs text-muted-foreground">
                {fmtDateTime(proximoSimulado.data_hora!)}
              </p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </section>
      )}

      {/* Card de ação contextual */}
      <section>
        {erros > 0 ? (
          /* Aluno tem erros: destaque para sessão de revisão */
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Sessão de Revisão</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Você errou {erros.toLocaleString("pt-BR")} {erros !== 1 ? "questões" : "questão"} —
                pratique as mais difíceis para melhorar seu desempenho.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/aluno/treino?erradas=1"
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold text-[#0f172a]"
                  style={{ background: TEAL }}
                >
                  Revisar agora
                </Link>
                <Link
                  href="/aluno/treino"
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Treinar livremente →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Aluno sem erros ou sem histórico: CTA simples de treino */
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${TEAL}20` }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="h-5 w-5"
                  style={{ color: TEAL }}
                  aria-hidden="true"
                >
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Treinar questões</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {total === 0
                    ? "Comece respondendo questões para ver seu desempenho aqui."
                    : "Continue praticando para melhorar seu desempenho."}
                </p>
                <div className="mt-3">
                  <Link
                    href="/aluno/treino"
                    className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold text-[#0f172a]"
                    style={{ background: TEAL }}
                  >
                    Continuar treinando →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
