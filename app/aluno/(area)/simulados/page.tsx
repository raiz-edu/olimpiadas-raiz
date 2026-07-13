import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getSimuladosDisponiveis } from "./actions";

const TEAL = "rgb(91,184,193)";

function fmtDuracao(seg: number | null) {
  if (!seg) return null;
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m}min`;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">Não iniciado</span>;
  if (status === "pausado")
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
        Pausado
      </span>
    );
  if (status === "em_andamento")
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
        Em andamento
      </span>
    );
  return (
    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400">
      Concluído
    </span>
  );
}

export default async function SimuladosPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const simulados = await getSimuladosDisponiveis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Simulados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avaliações cronometradas com salvamento automático de progresso.
        </p>
      </div>

      {simulados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum simulado disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {simulados.map((s) => {
            const sessaoStatus = s.sessao?.status ?? null;
            const concluido = sessaoStatus === "concluido";
            const emAndamento = sessaoStatus === "em_andamento" || sessaoStatus === "pausado";
            const presencial = !!s.polos;

            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {s.projeto_sigla ? (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                          style={{ background: TEAL }}
                        >
                          {s.projeto_sigla}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
                          Turma
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${presencial ? "bg-violet-500/10 text-violet-400" : "bg-sky-500/10 text-sky-400"}`}
                      >
                        {presencial ? "Presencial" : "Online"}
                      </span>
                      {s.duracao_minutos && (
                        <span className="text-xs text-muted-foreground">
                          ⏱ {fmtDuracao(s.duracao_minutos)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-semibold text-foreground">{s.titulo}</h2>
                    {s.projeto_nome && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.projeto_nome}</p>
                    )}
                    {s.data_hora && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmtDateTime(s.data_hora)}
                      </p>
                    )}
                    {s.descricao && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {s.descricao}
                      </p>
                    )}
                    {s.sessao && (
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={sessaoStatus} />
                        {s.sessao.tempo_restante && !concluido && (
                          <span className="text-xs text-muted-foreground">
                            · {fmtDuracao(s.sessao.tempo_restante)} restantes
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {!presencial && !concluido && (
                      <Link
                        href={`/aluno/simulados/${s.id}`}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-center text-[#0f172a] min-w-[120px]"
                        style={{ background: TEAL }}
                      >
                        {emAndamento ? "Retomar" : "Iniciar"}
                      </Link>
                    )}
                    {concluido && (
                      <Link
                        href={`/aluno/simulados/${s.id}/relatorio`}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Ver relatório
                      </Link>
                    )}
                    {presencial && !concluido && (
                      <span className="text-xs text-muted-foreground text-center px-4 py-2">
                        Realizado presencialmente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
