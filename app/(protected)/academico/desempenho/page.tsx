import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";

export const metadata = { title: "Engajamento e Desempenho — Olimpíadas" };

const TOP_POR_MARCA = 20;
const MEDALHAS = new Set(["ouro", "prata", "bronze", "mencao_honrosa"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function acertoCls(p: number | null) {
  if (p === null) return "text-muted-foreground/40";
  if (p >= 70) return "text-emerald-400";
  if (p >= 50) return "text-amber-400";
  return "text-red-400";
}

function AcertoBadge({ p }: { p: number | null }) {
  if (p === null) return <span className="text-muted-foreground/40">—</span>;
  return <span className={`font-semibold ${acertoCls(p)}`}>{p}%</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Linha = {
  id: string;
  nome: string;
  acessos: number;
  ultimoAcesso: string | null;
  respondidas: number;
  acertoPct: number | null;
  aulas: number;
  medalhas: number;
};

type MarcaBloco = {
  marca: string;
  linhas: Linha[];
  totAcessos: number;
  totRespondidas: number;
  totAcertos: number;
  totAulas: number;
  totMedalhas: number;
};

export default async function EngajamentoDesempenhoPage() {
  const session = await getServerSession();
  if (!session) return null;
  if (!can(session.user.role, "aluno:read")) redirect("/dashboard");

  const supabase = createAdminClient();

  const [{ data: alunos }, { data: marcas }] = await Promise.all([
    supabase
      .from("aluno")
      .select("id, nome, marca_id, last_login_at, login_count")
      .eq("ativo", true)
      .not("last_login_at", "is", null),
    supabase.from("marca").select("id, nome").order("nome"),
  ]);

  const marcaNomeMap = new Map((marcas ?? []).map((m) => [m.id, m.nome]));

  // Agrupa por marca e seleciona os TOP_POR_MARCA mais frequentes de cada uma
  type AlunoRow = NonNullable<typeof alunos>[number];
  const porMarca = new Map<string, AlunoRow[]>();
  for (const a of alunos ?? []) {
    const key = a.marca_id ?? "—";
    if (!porMarca.has(key)) porMarca.set(key, []);
    porMarca.get(key)!.push(a);
  }

  const topPorMarca = new Map<string, AlunoRow[]>();
  const topIds: string[] = [];
  for (const [marcaId, lista] of porMarca) {
    const top = lista
      .slice()
      .sort((a, b) => b.login_count - a.login_count)
      .slice(0, TOP_POR_MARCA);
    topPorMarca.set(marcaId, top);
    for (const a of top) topIds.push(a.id);
  }

  // Métricas de desempenho apenas para os alunos do top-N (volume pequeno)
  let respostas: { aluno_id: string; correta: boolean }[] = [];
  let progresso: { aluno_id: string }[] = [];
  let inscricoes: { id: string; aluno_id: string }[] = [];

  if (topIds.length > 0) {
    const [{ data: r }, { data: p }, { data: i }] = await Promise.all([
      supabase.from("resposta_aluno").select("aluno_id, correta").in("aluno_id", topIds),
      supabase
        .from("aluno_progresso")
        .select("aluno_id")
        .eq("assistido", true)
        .in("aluno_id", topIds),
      supabase.from("inscricao").select("id, aluno_id").in("aluno_id", topIds),
    ]);
    respostas = r ?? [];
    progresso = p ?? [];
    inscricoes = i ?? [];
  }

  // Medalhas: resultado premiado por inscrição → aluno
  const inscricaoAlunoMap = new Map(inscricoes.map((i) => [i.id, i.aluno_id]));
  const medalhasPorAluno = new Map<string, number>();
  if (inscricoes.length > 0) {
    const { data: resultados } = await supabase
      .from("resultado")
      .select("inscricao_id, tipo")
      .in(
        "inscricao_id",
        inscricoes.map((i) => i.id),
      );
    for (const res of resultados ?? []) {
      if (!MEDALHAS.has(res.tipo)) continue;
      const alunoId = inscricaoAlunoMap.get(res.inscricao_id);
      if (!alunoId) continue;
      medalhasPorAluno.set(alunoId, (medalhasPorAluno.get(alunoId) ?? 0) + 1);
    }
  }

  // Respostas de treino agregadas por aluno
  const respPorAluno = new Map<string, { respondidas: number; acertos: number }>();
  for (const r of respostas) {
    const cur = respPorAluno.get(r.aluno_id) ?? { respondidas: 0, acertos: 0 };
    cur.respondidas++;
    if (r.correta) cur.acertos++;
    respPorAluno.set(r.aluno_id, cur);
  }

  // Aulas assistidas por aluno
  const aulasPorAluno = new Map<string, number>();
  for (const p of progresso) {
    aulasPorAluno.set(p.aluno_id, (aulasPorAluno.get(p.aluno_id) ?? 0) + 1);
  }

  // Monta blocos por marca
  const blocos: MarcaBloco[] = [];
  for (const [marcaId, top] of topPorMarca) {
    const linhas: Linha[] = top.map((a) => {
      const resp = respPorAluno.get(a.id) ?? { respondidas: 0, acertos: 0 };
      const acertoPct =
        resp.respondidas > 0 ? Math.round((resp.acertos / resp.respondidas) * 100) : null;
      return {
        id: a.id,
        nome: a.nome,
        acessos: a.login_count,
        ultimoAcesso: a.last_login_at,
        respondidas: resp.respondidas,
        acertoPct,
        aulas: aulasPorAluno.get(a.id) ?? 0,
        medalhas: medalhasPorAluno.get(a.id) ?? 0,
      };
    });

    const totRespondidas = linhas.reduce((s, l) => s + l.respondidas, 0);
    const totAcertos = top.reduce((s, a) => s + (respPorAluno.get(a.id)?.acertos ?? 0), 0);

    blocos.push({
      marca: marcaNomeMap.get(marcaId) ?? "—",
      linhas,
      totAcessos: linhas.reduce((s, l) => s + l.acessos, 0),
      totRespondidas,
      totAcertos,
      totAulas: linhas.reduce((s, l) => s + l.aulas, 0),
      totMedalhas: linhas.reduce((s, l) => s + l.medalhas, 0),
    });
  }

  // Marcas com mais acessos primeiro
  blocos.sort((a, b) => b.totAcessos - a.totAcessos);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Engajamento e Desempenho</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os {TOP_POR_MARCA} alunos mais frequentes de cada marca na Plataforma Olímpica, com
          desempenho no treino, aulas assistidas e premiações.
        </p>
      </div>

      {blocos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum aluno acessou a plataforma ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {blocos.map((b) => {
            const acertoMarca =
              b.totRespondidas > 0 ? Math.round((b.totAcertos / b.totRespondidas) * 100) : null;
            return (
              <div key={b.marca} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {b.marca}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {b.linhas.length} {b.linhas.length === 1 ? "aluno" : "alunos"}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                          Aluno
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-foreground">
                          Acessos
                        </th>
                        <th className="hidden px-3 py-2 text-right text-[11px] font-medium text-muted-foreground sm:table-cell">
                          Último acesso
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
                          Questões
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
                          % Acerto
                        </th>
                        <th className="hidden px-3 py-2 text-center text-[11px] font-medium text-muted-foreground md:table-cell">
                          Aulas
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-yellow-400">
                          Medalhas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {b.linhas.map((l, idx) => (
                        <tr key={l.id} className="bg-card hover:bg-background/50">
                          <td className="px-3 py-2 font-medium text-foreground">
                            <span className="mr-2 text-[11px] text-muted-foreground/50">
                              {idx + 1}.
                            </span>
                            {l.nome}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-foreground">
                            {fmt(l.acessos)}
                          </td>
                          <td className="hidden px-3 py-2 text-right text-[11px] text-muted-foreground sm:table-cell">
                            {l.ultimoAcesso
                              ? new Date(l.ultimoAcesso).toLocaleString("pt-BR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-foreground">
                            {l.respondidas > 0 ? fmt(l.respondidas) : "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <AcertoBadge p={l.acertoPct} />
                          </td>
                          <td className="hidden px-3 py-2 text-center text-foreground md:table-cell">
                            {l.aulas > 0 ? fmt(l.aulas) : "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-yellow-400">
                            {l.medalhas > 0 ? l.medalhas : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-background/60 text-[11px]">
                        <td className="px-3 py-2 font-semibold text-muted-foreground">
                          Média / total da marca
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-foreground">
                          {fmt(b.totAcessos)}
                        </td>
                        <td className="hidden px-3 py-2 sm:table-cell" />
                        <td className="px-3 py-2 text-center text-foreground">
                          {b.totRespondidas > 0 ? fmt(b.totRespondidas) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <AcertoBadge p={acertoMarca} />
                        </td>
                        <td className="hidden px-3 py-2 text-center text-foreground md:table-cell">
                          {b.totAulas > 0 ? fmt(b.totAulas) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center text-yellow-400">
                          {b.totMedalhas > 0 ? b.totMedalhas : "—"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">
            Frequência por acessos à Plataforma Olímpica. % de acerto = respostas corretas ÷
            questões de treino respondidas (verde ≥ 70% · âmbar ≥ 50% · vermelho &lt; 50%). Medalhas
            = ouro, prata, bronze e menção honrosa em olimpíadas.
          </p>
        </div>
      )}
    </div>
  );
}
