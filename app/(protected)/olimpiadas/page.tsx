import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarcaMultiSelect } from "@/components/olimpiadas/marca-multi-select";
import { OlimpiadaMultiSelect } from "@/components/olimpiadas/olimpiada-multi-select";
import { YearMultiSelect } from "@/components/dashboard/year-multi-select";
import { OlimpiadasTable } from "@/components/olimpiadas/olimpiadas-table";
import type { OlimpiadaStats } from "@/components/olimpiadas/olimpiadas-table";
import { OLIMPIADAS_NACIONAIS } from "@/lib/olimpiadas/nacionais";

const ANO_INICIO = 2021;

export const metadata = { title: "Olimpíadas — Olimpíadas" };

export default async function OlimpiadasPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; olimpiada?: string; anos?: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const sp = await searchParams;

  const marcaParam = sp.marca ?? "todas";
  const olimpiadaParam = sp.olimpiada ?? "todas";

  const marcaTodosMode = marcaParam === "todas";
  const olimpiadaTodosMode = olimpiadaParam === "todas";

  const selectedMarcas = marcaTodosMode ? [] : marcaParam.split(",").filter(Boolean);
  const selectedOlimpiadas = olimpiadaTodosMode ? [] : olimpiadaParam.split(",").filter(Boolean);

  const anoCorrente = new Date().getFullYear();
  const anosDisponiveis = Array.from(
    { length: anoCorrente - ANO_INICIO + 1 },
    (_, i) => ANO_INICIO + i,
  ).reverse();
  const todosModeAnos = sp.anos === "todos";
  const selectedYears: number[] = todosModeAnos
    ? anosDisponiveis
    : sp.anos
      ? sp.anos
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && anosDisponiveis.includes(n))
      : [anoCorrente];

  const [{ data: marcas }, { data: olimpiadasDb }, { data: statsData }] = await Promise.all([
    supabase.from("marca").select("id, nome").order("nome"),
    supabase.from("olimpiada").select("nome").eq("ativo", true),
    // RPC agrega tudo no banco — sem limite de linhas e sem múltiplas queries
    supabase.rpc("get_olimpiadas_stats", {
      p_anos: selectedYears,
      p_marcas: marcaTodosMode ? [] : selectedMarcas,
      p_siglas: olimpiadaTodosMode ? [] : selectedOlimpiadas,
    }),
  ]);

  // Determina quais siglas de OLIMPIADAS_NACIONAIS têm dados no banco
  const siglasComDados = new Set<string>();
  for (const o of olimpiadasDb ?? []) {
    const upper = o.nome.toUpperCase();
    for (const nacional of OLIMPIADAS_NACIONAIS) {
      const siglaUpper = nacional.sigla.toUpperCase();
      if (
        upper === siglaUpper ||
        upper.startsWith(siglaUpper + " ") ||
        upper.startsWith(siglaUpper + " —") ||
        upper.startsWith(siglaUpper + "-")
      ) {
        siglasComDados.add(nacional.sigla);
        break;
      }
    }
  }
  const olimpiadasDisponiveis = OLIMPIADAS_NACIONAIS.filter((o) => siglasComDados.has(o.sigla));

  // Mapeia resultado do RPC para OlimpiadaStats
  const statsRows: OlimpiadaStats[] = (statsData ?? [])
    .map((row) => ({
      nome: row.olimpiada_nome ?? "—",
      marca: row.marca_nome ?? "—",
      inscritos: Number(row.inscritos),
      participantes: Number(row.participantes),
      ouro: Number(row.ouro),
      prata: Number(row.prata),
      bronze: Number(row.bronze),
      mencao: Number(row.mencao),
    }))
    .sort((a, b) => {
      const marcaCmp = a.marca.localeCompare(b.marca, "pt-BR");
      return marcaCmp !== 0 ? marcaCmp : a.nome.localeCompare(b.nome, "pt-BR");
    });

  const totals = statsRows.reduce(
    (acc, r) => ({
      inscritos: acc.inscritos + r.inscritos,
      participantes: acc.participantes + r.participantes,
      ouro: acc.ouro + r.ouro,
      prata: acc.prata + r.prata,
      bronze: acc.bronze + r.bronze,
      mencao: acc.mencao + r.mencao,
    }),
    { inscritos: 0, participantes: 0, ouro: 0, prata: 0, bronze: 0, mencao: 0 },
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olimpíadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Participação por marca, olimpíada e ano
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Marca
          </p>
          <MarcaMultiSelect marcas={marcas ?? []} />
        </div>

        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Olimpíada
          </p>
          <OlimpiadaMultiSelect olimpiadas={olimpiadasDisponiveis} />
        </div>

        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Ano
          </p>
          <YearMultiSelect
            anos={anosDisponiveis}
            selected={selectedYears}
            todosMode={todosModeAnos}
          />
        </div>
      </div>

      {/* Tabela com seletor de colunas */}
      <OlimpiadasTable statsRows={statsRows} totals={totals} />
    </div>
  );
}
