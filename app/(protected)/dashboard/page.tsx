import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { YearMultiSelect } from "@/components/dashboard/year-multi-select";

export const metadata = { title: "Painel — Olimpíadas" };

const ANO_INICIO = 2021;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();

  // Lista fixa de anos disponíveis: 2021 → ano atual
  const anoCorrente = new Date().getFullYear();
  const anosDisponiveis = Array.from(
    { length: anoCorrente - ANO_INICIO + 1 },
    (_, i) => ANO_INICIO + i,
  ).reverse();

  // Ano selecionado via searchParams (padrão: ano corrente)
  const sp = await searchParams;
  const selectedYear: number =
    sp.ano && !isNaN(Number(sp.ano)) && anosDisponiveis.includes(Number(sp.ano))
      ? Number(sp.ano)
      : anoCorrente;

  // Queries paralelas
  const [
    { data: inscricoes },
    { data: unidadesData },
    { data: marcasListData },
    { data: resultadosData },
  ] = await Promise.all([
    supabase
      .from("v_dashboard_inscricoes")
      .select("inscricao_id, status, marca_nome, olimpiada_nome")
      .eq("ano_letivo", selectedYear),
    supabase
      .from("unidade")
      .select(
        "id, marca_id, marca:marca_id(id, nome), turmas:turma(id, ano_letivo, alunos:aluno(id, ativo))",
      )
      .order("nome"),
    supabase.from("marca").select("id, nome").order("nome"),
    supabase.from("resultado").select("inscricao_id, tipo"),
  ]);

  // Map inscricao_id → marca_nome para cruzar com resultados
  const inscricaoMarcaMap = new Map((inscricoes ?? []).map((i) => [i.inscricao_id, i.marca_nome]));

  // Computar rows por marca — agrupa unidades por marca
  type TurmaRaw = {
    id: string;
    ano_letivo: number | null;
    alunos: { id: string; ativo: boolean }[] | null;
  };
  type UnidadeRaw = {
    id: string;
    marca_id: string;
    marca: { id: string; nome: string } | { id: string; nome: string }[] | null;
    turmas: TurmaRaw[] | null;
  };

  const unidadeList = (unidadesData ?? []) as unknown as UnidadeRaw[];

  const brandRows = (marcasListData ?? []).map((m) => {
    const minhas = unidadeList.filter((u) => {
      const marcaObj = Array.isArray(u.marca) ? u.marca[0] : u.marca;
      return (marcaObj as { id: string } | null)?.id === m.id;
    });

    const numAlunos = minhas.reduce((acc, u) => {
      const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as TurmaRaw[];
      return (
        acc +
        turmas
          .filter((t) => t.ano_letivo === selectedYear)
          .reduce((a2, t) => {
            const alunos = (Array.isArray(t.alunos) ? t.alunos : []) as {
              id: string;
              ativo: boolean;
            }[];
            return a2 + alunos.filter((a) => a.ativo).length;
          }, 0)
      );
    }, 0);

    const inscricoesM = (inscricoes ?? []).filter((i) => i.marca_nome === m.nome);
    const numInscritos = inscricoesM.length;
    const numConfirmados = inscricoesM.filter((i) => i.status === "confirmada").length;

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
      numAlunos,
      numInscritos,
      numConfirmados,
      totalResultado: totalResultadoM,
      ...tipos,
    };
  });

  // KPIs agregados
  const totalInscritos = brandRows.reduce((s, b) => s + b.numAlunos, 0);
  const totalParticipantes = brandRows.reduce((s, b) => s + b.numInscritos, 0);
  const totalConfirmados = brandRows.reduce((s, b) => s + b.numConfirmados, 0);
  const mediaEngajamento =
    totalParticipantes > 0 ? Math.round((totalConfirmados / totalParticipantes) * 100) : 0;
  const totalOuro = brandRows.reduce((s, b) => s + b.ouro, 0);
  const totalPrata = brandRows.reduce((s, b) => s + b.prata, 0);
  const totalBronze = brandRows.reduce((s, b) => s + b.bronze, 0);
  const totalMencao = brandRows.reduce((s, b) => s + b.mencao_honrosa, 0);
  const totalResultados = brandRows.reduce((s, b) => s + b.totalResultado, 0);

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
        <YearMultiSelect anos={anosDisponiveis} selected={selectedYear} />
      </div>

      {/* KPI Cards */}
      <div className="space-y-4">
        {/* Grupo: Alunos */}
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

        {/* Grupo: Resultados */}
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

      {/* Tabela por marca */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/50 bg-background">
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
                colSpan={4}
              >
                Resultados
              </th>
            </tr>
            <tr className="border-b border-border bg-background">
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Inscritos
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Participantes
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Engajados
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Ouro
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Prata
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Bronze
              </th>
              <th
                className="px-4 py-2 text-center text-xs font-medium"
                style={{ color: "rgb(91,184,193)" }}
              >
                Menção Honrosa
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brandRows.map((b) => (
              <tr key={b.id} className="hover:bg-background/50">
                <td className="px-4 py-3 text-center text-muted-foreground">{b.nome}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numAlunos}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numInscritos}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numConfirmados}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.ouro}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.prata}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.bronze}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.mencao_honrosa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
