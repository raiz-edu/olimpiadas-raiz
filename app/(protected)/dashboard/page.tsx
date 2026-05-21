import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getAnoAnalise } from "@/lib/auth/ano-analise";
import { MarcaResultadoChart } from "@/components/dashboard/marca-resultado-chart";

export const metadata = { title: "Painel — Olimpíadas" };

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
    { data: inscricoes },
    { data: unidadesData },
    { data: marcasListData },
    { data: resultadosData },
  ] = await Promise.all([
    supabase
      .from("v_dashboard_inscricoes")
      .select("inscricao_id, status, marca_nome, olimpiada_nome")
      .eq("ano_letivo", anoAtual),
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

    const numUnidades = minhas.length;

    const numTurmas = minhas.reduce((acc, u) => {
      const turmas = (Array.isArray(u.turmas) ? u.turmas : []) as TurmaRaw[];
      return acc + turmas.filter((t) => t.ano_letivo === anoAtual).length;
    }, 0);

    const numAlunos = minhas.reduce((acc, u) => {
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
      numAlunos,
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
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[user.role]} · {anoAtual}
        </p>
      </div>

      {/* Tabela por marca */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
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
                rowSpan={2}
              >
                Unidades
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                rowSpan={2}
              >
                Inscritos
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                rowSpan={2}
              >
                Adesão
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                rowSpan={2}
              >
                Engajamento
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: "rgb(91,184,193)" }}
                colSpan={4}
              >
                Resultado
              </th>
            </tr>
            <tr className="border-b border-border bg-background">
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
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numUnidades}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numInscritos}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.numAlunos}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.engajamento}%</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.ouro}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.prata}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.bronze}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{b.mencao_honrosa}</td>
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
