import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Dashboard — Programa Raiz Olímpica" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_FASE_LABEL: Record<string, string> = {
  inscricao: "Inscrições",
  prova_1: "1ª Fase",
  prova_2: "2ª Fase",
  final: "Final",
  divulgacao: "Divulgação",
};

const TIPO_FASE_COR: Record<string, string> = {
  inscricao: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  prova_1: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  prova_2: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  final: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  divulgacao: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const SIMULADO_COR = "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] border-[rgb(91,184,193)]/30";

function fmtData(iso: string, modo: "curta" | "longa" = "longa"): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: modo === "longa" ? "long" : "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function diasRestantes(dataIso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dataIso + "T12:00:00");
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Evento = {
  id: string;
  tipo: "fase" | "simulado";
  tipoFase?: string;
  nome: string;
  olimpiada?: string;
  dataInicio: string;
  dataFim?: string;
  diasInicio: number;
  fasesPendentes?: boolean;
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const supabase = createAdminClient();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeIso = hoje.toISOString().split("T")[0]!;
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + 60);
  const limiteIso = limite.toISOString().split("T")[0]!;

  // Fases de olimpíadas nos próximos 60 dias (inclui em andamento)
  const [{ data: fases }, { data: simulados }] = await Promise.all([
    supabase
      .from("olimpiada_fase")
      .select(
        "id, tipo, nome, data_inicio, data_fim, olimpiada:olimpiada_id(nome, fases_pendentes)",
      )
      .lte("data_inicio", limiteIso)
      .gte("data_fim", hojeIso)
      .order("data_inicio"),
    supabase
      .from("preparacao_aula")
      .select("id, titulo, data_hora")
      .eq("tipo", "simulado")
      .eq("publicada", true)
      .gte("data_hora", hoje.toISOString())
      .lte("data_hora", limite.toISOString())
      .order("data_hora"),
  ]);

  const eventos: Evento[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((fases ?? []) as any[]).map((f) => {
      const ol = Array.isArray(f.olimpiada) ? f.olimpiada[0] : f.olimpiada;
      return {
        id: f.id,
        tipo: "fase" as const,
        tipoFase: f.tipo,
        nome: f.nome,
        olimpiada: ol?.nome ?? "",
        fasesPendentes: ol?.fases_pendentes ?? false,
        dataInicio: f.data_inicio,
        dataFim: f.data_fim,
        diasInicio: diasRestantes(f.data_inicio),
      };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((simulados ?? []) as any[]).map((s) => ({
      id: s.id,
      tipo: "simulado" as const,
      nome: s.titulo,
      dataInicio: s.data_hora.split("T")[0]!,
      diasInicio: diasRestantes(s.data_hora.split("T")[0]!),
    })),
  ].sort((a, b) => a.diasInicio - b.diasInicio);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Próximos 60 dias — fases de olimpíadas e simulados agendados.
        </p>
      </div>

      {eventos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum evento nos próximos 60 dias.
        </div>
      ) : (
        (() => {
          // Agrupa eventos por faixa de proximidade
          type Grupo = { label: string; dot: string; headerCls: string; eventos: typeof eventos };
          const grupos: Grupo[] = [
            {
              label: "Em andamento",
              dot: "bg-emerald-400",
              headerCls: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
              eventos: eventos.filter((e) => e.diasInicio < 0),
            },
            {
              label: "Hoje",
              dot: "bg-red-400",
              headerCls: "text-red-400 border-red-400/20 bg-red-400/5",
              eventos: eventos.filter((e) => e.diasInicio === 0),
            },
            {
              label: "Amanhã",
              dot: "bg-amber-400",
              headerCls: "text-amber-400 border-amber-400/20 bg-amber-400/5",
              eventos: eventos.filter((e) => e.diasInicio === 1),
            },
            {
              label: "Esta semana",
              dot: "bg-yellow-400",
              headerCls: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
              eventos: eventos.filter((e) => e.diasInicio >= 2 && e.diasInicio <= 7),
            },
            {
              label: "Próxima semana",
              dot: "bg-[rgb(91,184,193)]",
              headerCls:
                "text-[rgb(91,184,193)] border-[rgb(91,184,193)]/20 bg-[rgb(91,184,193)]/5",
              eventos: eventos.filter((e) => e.diasInicio >= 8 && e.diasInicio <= 14),
            },
            {
              label: "Em breve",
              dot: "bg-muted-foreground",
              headerCls: "text-muted-foreground border-border bg-muted/20",
              eventos: eventos.filter((e) => e.diasInicio > 14),
            },
          ].filter((g) => g.eventos.length > 0);

          function EventoItem({ ev }: { ev: (typeof eventos)[0] }) {
            const cor =
              ev.tipo === "simulado"
                ? SIMULADO_COR
                : (TIPO_FASE_COR[ev.tipoFase ?? ""] ??
                  "bg-muted/30 text-muted-foreground border-border");
            const tipoLabel =
              ev.tipo === "simulado"
                ? "Simulado"
                : (TIPO_FASE_LABEL[ev.tipoFase ?? ""] ?? ev.tipoFase ?? "");

            return (
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-base font-black tabular-nums text-foreground leading-none">
                    {new Date(ev.dataInicio + "T12:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${cor}`}
                    >
                      {tipoLabel}
                    </span>
                    {ev.olimpiada && (
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                        {ev.olimpiada}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{ev.nome}</p>
                  {ev.dataFim && ev.dataFim !== ev.dataInicio && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      até {fmtData(ev.dataFim, "curta")}
                    </p>
                  )}
                  {ev.fasesPendentes && (
                    <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3 shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Data não confirmada — verifique o site oficial
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {grupos.map((grupo) => (
                <div
                  key={grupo.label}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Header do grupo */}
                  <div
                    className={`flex items-center gap-2 px-5 py-2.5 border-b border-border/50 ${grupo.headerCls}`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${grupo.dot}`} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {grupo.label}
                    </span>
                    <span className="ml-auto text-[10px] font-semibold opacity-60">
                      {grupo.eventos.length} evento{grupo.eventos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Eventos do grupo */}
                  <div className="divide-y divide-border/50">
                    {grupo.eventos.map((ev) => (
                      <EventoItem key={ev.id} ev={ev} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}
