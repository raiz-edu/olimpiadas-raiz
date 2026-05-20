import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getAnoAnalise } from "@/lib/auth/ano-analise";
import { MarcaResultadoChart } from "@/components/dashboard/marca-resultado-chart";

export const metadata = { title: "Dashboard — Olimpíadas" };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  color?: "blue" | "green" | "amber" | "purple";
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub ?? " "}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();
  const anoAtual = await getAnoAnalise();

  // Queries paralelas
  const [
    { count: totalOlimpiadas },
    { count: totalAlunos },
    { data: inscricoes },
    { count: totalResultados },
    { data: marcasData },
    { data: resultadosData },
  ] = await Promise.all([
    supabase.from("olimpiada").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("aluno").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase
      .from("v_dashboard_inscricoes")
      .select("inscricao_id, status, marca_nome, olimpiada_nome")
      .eq("ano_letivo", anoAtual),
    supabase.from("resultado").select("*", { count: "exact", head: true }),
    supabase
      .from("marca")
      .select(
        "id, nome, unidades:unidade(id, turmas:turma(id, ano_letivo, alunos:aluno(id, ativo)))",
      )
      .order("nome"),
    supabase.from("resultado").select("inscricao_id, tipo"),
  ]);

  const totalInscricoes = inscricoes?.length ?? 0;

  // Map inscricao_id → marca_nome para cruzar com resultados
  const inscricaoMarcaMap = new Map((inscricoes ?? []).map((i) => [i.inscricao_id, i.marca_nome]));

  // Computar rows por marca
  type TurmaRaw = {
    id: string;
    ano_letivo: number | null;
    alunos: { id: string; ativo: boolean }[] | null;
  };
  type UnidadeRaw = { id: string; turmas: TurmaRaw[] | null };
  type MarcaRaw = { id: string; nome: string; unidades: UnidadeRaw[] | null };

  const brandRows = ((marcasData as MarcaRaw[]) ?? []).map((m) => {
    const unidades = (Array.isArray(m.unidades) ? m.unidades : []) as UnidadeRaw[];
    const numUnidades = unidades.length;

    const numTurmas = unidades.reduce((acc, u) => {
      const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as TurmaRaw[];
      return acc + turmas.filter((t) => t.ano_letivo === anoAtual).length;
    }, 0);

    const numAlunos = unidades.reduce((acc, u) => {
      const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as TurmaRaw[];
      return (
        acc +
        turmas
          .filter((t) => t.ano_letivo === anoAtual)
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

    const adesao = numAlunos > 0 ? Math.round((numInscritos / numAlunos) * 100) : 0;
    const engajamento = numInscritos > 0 ? Math.round((numConfirmados / numInscritos) * 100) : 0;

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
      numUnidades,
      numTurmas,
      numInscritos,
      adesao,
      engajamento,
      totalResultado: totalResultadoM,
      ...tipos,
    };
  });

  const chartData = brandRows.map((b) => ({
    nome: b.nome,
    ouro: b.ouro,
    prata: b.prata,
    bronze: b.bronze,
    mencao_honrosa: b.mencao_honrosa,
  }));

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {user.nome.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[user.role]} · {anoAtual}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Olimpíadas ativas"
          value={totalOlimpiadas ?? 0}
          href="/olimpiadas"
          color="blue"
        />
        <StatCard label="Alunos ativos" value={totalAlunos ?? 0} href="/alunos" color="green" />
        <StatCard
          label={`Inscrições ${anoAtual}`}
          value={totalInscricoes}
          sub={`${porStatus["confirmada"] ?? 0} confirmadas`}
          href="/inscricoes"
          color="amber"
        />
        <StatCard
          label="Resultados registrados"
          value={totalResultados ?? 0}
          href="/resultados"
          color="purple"
        />
      </div>

      {/* Tabela por marca */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidades</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Turmas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscritos</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Adesão</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Engajamento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brandRows.map((b) => (
              <tr key={b.id} className="hover:bg-background/50">
                <td className="px-4 py-3 text-muted-foreground">{b.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.numUnidades}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.numTurmas}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.numInscritos}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.adesao}%</td>
                <td className="px-4 py-3 text-muted-foreground">{b.engajamento}%</td>
                <td className="px-4 py-3 text-muted-foreground">{b.totalResultado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráfico de resultados por marca */}
      <MarcaResultadoChart data={chartData} />
    </div>
  );
}
