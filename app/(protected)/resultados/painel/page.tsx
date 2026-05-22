import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { YearMultiSelect } from "@/components/dashboard/year-multi-select";

export const metadata = { title: "Painel — Olimpíadas" };

const ANO_INICIO = 2021;

export default async function ResultadosPainelPage({
  searchParams,
}: {
  searchParams: Promise<{ anos?: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  const anoCorrente = new Date().getFullYear();
  const anosDisponiveis = Array.from(
    { length: anoCorrente - ANO_INICIO + 1 },
    (_, i) => ANO_INICIO + i,
  ).reverse();

  const sp = await searchParams;
  const todosMode = sp.anos === "todos";
  const selectedYears: number[] = todosMode
    ? anosDisponiveis
    : sp.anos
      ? sp.anos
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && anosDisponiveis.includes(n))
      : [anoCorrente];

  const [{ data: inscricoes }, { data: marcasListData }, { data: resultadosData }] =
    await Promise.all([
      supabase
        .from("v_dashboard_inscricoes")
        .select("inscricao_id, status, marca_nome, olimpiada_nome")
        .in("ano_letivo", selectedYears),
      supabase.from("marca").select("id, nome").order("nome"),
      supabase.from("resultado").select("inscricao_id, tipo"),
    ]);

  const inscricaoMarcaMap = new Map((inscricoes ?? []).map((i) => [i.inscricao_id, i.marca_nome]));

  const brandRows = (marcasListData ?? []).map((m) => {
    const inscricoesM = (inscricoes ?? []).filter((i) => i.marca_nome === m.nome);
    // Inscritos = total de inscrições (qualquer status)
    const numInscritos = inscricoesM.length;
    // Participantes = inscrições confirmadas (subconjunto dos inscritos)
    const numParticipantes = inscricoesM.filter((i) => i.status === "confirmada").length;

    const tipos = { ouro: 0, prata: 0, bronze: 0, mencao_honrosa: 0 };
    for (const r of resultadosData ?? []) {
      if (inscricaoMarcaMap.get(r.inscricao_id) === m.nome && r.tipo in tipos) {
        tipos[r.tipo as keyof typeof tipos]++;
      }
    }
    const totalResultadoM = tipos.ouro + tipos.prata + tipos.bronze + tipos.mencao_honrosa;

    return {
      id: m.id,
      nome: m.nome,
      numInscritos,
      numParticipantes,
      totalResultado: totalResultadoM,
      ...tipos,
    };
  });

  brandRows.sort((a, b) => {
    if (b.ouro !== a.ouro) return b.ouro - a.ouro;
    if (b.prata !== a.prata) return b.prata - a.prata;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const maxTotal = Math.max(...brandRows.map((b) => b.totalResultado), 0);

  const ranks: number[] = [];
  let currentRank = 0;
  for (let i = 0; i < brandRows.length; i++) {
    const curr = brandRows[i]!;
    if (i === 0) {
      currentRank = 1;
    } else {
      const prev = brandRows[i - 1]!;
      if (curr.ouro !== prev.ouro || curr.prata !== prev.prata || curr.bronze !== prev.bronze) {
        currentRank = i + 1;
      }
    }
    ranks.push(currentRank);
  }

  const totalInscritos = brandRows.reduce((s, b) => s + b.numInscritos, 0);
  const totalParticipantes = brandRows.reduce((s, b) => s + b.numParticipantes, 0);
  const mediaEngajamento =
    totalInscritos > 0 ? Math.round((totalParticipantes / totalInscritos) * 100) : 0;
  const totalOuro = brandRows.reduce((s, b) => s + b.ouro, 0);
  const totalPrata = brandRows.reduce((s, b) => s + b.prata, 0);
  const totalBronze = brandRows.reduce((s, b) => s + b.bronze, 0);
  const totalMencao = brandRows.reduce((s, b) => s + b.mencao_honrosa, 0);
  const totalResultados = brandRows.reduce((s, b) => s + b.totalResultado, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
        <YearMultiSelect anos={anosDisponiveis} selected={selectedYears} todosMode={todosMode} />
      </div>

      <div className="space-y-4">
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Alunos
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Inscritos", value: totalInscritos.toLocaleString("pt-BR") },
              { label: "Participantes", value: totalParticipantes.toLocaleString("pt-BR") },
              { label: "Engajamento", value: `${mediaEngajamento}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: "rgb(91,184,193)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Resultados
          </p>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Ouro", value: totalOuro },
              { label: "Prata", value: totalPrata },
              { label: "Bronze", value: totalBronze },
              { label: "Menção Honrosa", value: totalMencao },
              { label: "Total", value: totalResultados },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: "rgb(91,184,193)" }}>
                  {value.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[5%]" />
            <col className="w-[13%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/50 bg-background">
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                rowSpan={2}
              >
                #
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                rowSpan={2}
              >
                Marca
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                colSpan={3}
              >
                Alunos
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                colSpan={5}
              >
                Resultados
              </th>
            </tr>
            <tr className="border-b border-border bg-background">
              {[
                "Inscritos",
                "Participantes",
                "Engajamento",
                "Ouro",
                "Prata",
                "Bronze",
                "Menção Honrosa",
                "Total",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-center text-xs font-medium"
                  style={{ color: "rgb(91,184,193)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brandRows.map((b, i) => (
              <tr key={b.id} className="hover:bg-background/50">
                <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  {ranks[i]}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.nome}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numInscritos}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {b.numParticipantes}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {b.numInscritos > 0
                    ? `${Math.round((b.numParticipantes / b.numInscritos) * 100)}%`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.ouro}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.prata}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.bronze}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.mencao_honrosa}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                      {b.totalResultado}
                    </span>
                    <div
                      className="flex-1 overflow-hidden rounded-full"
                      style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:
                            maxTotal > 0
                              ? `${Math.round((b.totalResultado / maxTotal) * 100)}%`
                              : "0%",
                          backgroundColor: "rgb(91,184,193)",
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
