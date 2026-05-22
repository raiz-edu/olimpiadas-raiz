import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarcaMultiSelect } from "@/components/olimpiadas/marca-multi-select";
import { OlimpiadaMultiSelect } from "@/components/olimpiadas/olimpiada-multi-select";
import { YearMultiSelect } from "@/components/dashboard/year-multi-select";
import { OlimpiadasTable } from "@/components/olimpiadas/olimpiadas-table";
import type { OlimpiadaStats } from "@/components/olimpiadas/olimpiadas-table";
import type { TipoResultado } from "@/lib/types/database";

const ANO_INICIO = 2021;

export const metadata = { title: "Olimpíadas — Olimpíadas" };

const MEDAL_PRIORITY: Partial<Record<TipoResultado, number>> = {
  ouro: 4,
  prata: 3,
  bronze: 2,
  mencao_honrosa: 1,
};

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

  const { data: marcas } = await supabase.from("marca").select("id, nome").order("nome");

  // Query 1: inscrições filtradas (limite alto para pegar todos os registros)
  let inscricoesQuery = supabase
    .from("v_dashboard_inscricoes")
    .select("inscricao_id, olimpiada_nome, marca_nome, status")
    .in("ano_letivo", selectedYears)
    .limit(50000);

  if (!marcaTodosMode && selectedMarcas.length > 0) {
    inscricoesQuery = inscricoesQuery.in("marca_nome", selectedMarcas);
  }
  if (!olimpiadaTodosMode && selectedOlimpiadas.length > 0) {
    const conditions = selectedOlimpiadas.map((s) => `olimpiada_nome.ilike.%${s}%`).join(",");
    inscricoesQuery = inscricoesQuery.or(conditions);
  }

  const { data: inscricoes } = await inscricoesQuery;

  // Query 2: resultados em lotes paralelos para evitar URLs longas demais
  // (PostgREST tem limite de URL ~8KB; 1 UUID = 36 chars)
  const inscricaoIds = (inscricoes ?? []).map((i) => i.inscricao_id);
  const resultadoMap = new Map<string, TipoResultado>();

  if (inscricaoIds.length > 0) {
    const BATCH = 200;
    const batches: string[][] = [];
    for (let i = 0; i < inscricaoIds.length; i += BATCH) {
      batches.push(inscricaoIds.slice(i, i + BATCH));
    }

    const batchResults = await Promise.all(
      batches.map((chunk) =>
        supabase.from("resultado").select("inscricao_id, tipo").in("inscricao_id", chunk),
      ),
    );

    const todosResultados = batchResults.flatMap((r) => r.data ?? []);

    // Por inscrição, guarda o melhor resultado (ouro > prata > bronze > menção)
    for (const r of todosResultados) {
      const current = resultadoMap.get(r.inscricao_id);
      const currentPrio = current ? (MEDAL_PRIORITY[current] ?? 0) : 0;
      const newPrio = MEDAL_PRIORITY[r.tipo] ?? 0;
      if (newPrio > currentPrio) {
        resultadoMap.set(r.inscricao_id, r.tipo);
      }
    }
  }

  // Agregação por (marca × olimpíada)
  const statsMap = new Map<string, OlimpiadaStats>();
  for (const row of inscricoes ?? []) {
    const nome = row.olimpiada_nome ?? "—";
    const marca = row.marca_nome ?? "—";
    const key = `${marca}::${nome}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        nome,
        marca,
        inscritos: 0,
        participantes: 0,
        ouro: 0,
        prata: 0,
        bronze: 0,
        mencao: 0,
      });
    }
    const s = statsMap.get(key)!;
    s.inscritos++;
    if (row.status === "confirmada") s.participantes++;

    const tipo = resultadoMap.get(row.inscricao_id);
    if (tipo === "ouro") s.ouro++;
    else if (tipo === "prata") s.prata++;
    else if (tipo === "bronze") s.bronze++;
    else if (tipo === "mencao_honrosa") s.mencao++;
  }

  const statsRows = Array.from(statsMap.values()).sort((a, b) => {
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
          <OlimpiadaMultiSelect />
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
