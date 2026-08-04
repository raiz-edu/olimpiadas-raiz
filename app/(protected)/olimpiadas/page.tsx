import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarcaMultiSelect } from "@/components/olimpiadas/marca-multi-select";
import { OlimpiadaMultiSelect } from "@/components/olimpiadas/olimpiada-multi-select";
import { YearMultiSelect } from "@/components/dashboard/year-multi-select";
import { OlimpiadasTable } from "@/components/olimpiadas/olimpiadas-table";
import type { OlimpiadaStats } from "@/components/olimpiadas/olimpiadas-table";
import { OLIMPIADAS_NACIONAIS } from "@/lib/olimpiadas/nacionais";

const ANO_INICIO = 2021;

export const metadata = { title: "Histórico — Olimpíadas" };

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
  const selectedMarcas = marcaTodosMode ? [] : marcaParam.split(",").filter(Boolean);

  const anoCorrente = new Date().getFullYear();
  const anosDisponiveis = Array.from(
    { length: anoCorrente - ANO_INICIO + 1 },
    (_, i) => ANO_INICIO + i,
  ).reverse();
  const todosModeAnos = !sp.anos || sp.anos === "todos";
  const parsedYears = todosModeAnos
    ? anosDisponiveis
    : sp
        .anos!.split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && anosDisponiveis.includes(n));
  // Nunca deixar selectedYears vazio — fallback para todos os anos; sempre ascendente
  const selectedYears: number[] = (parsedYears.length > 0 ? parsedYears : anosDisponiveis)
    .slice()
    .sort((a, b) => a - b);

  // Passo 1: olimpíadas disponíveis (query leve, necessária para o redirect padrão)
  const [{ data: olimpiadasDb }, { data: siglasAgregadas }] = await Promise.all([
    supabase.from("olimpiada").select("nome").eq("ativo", true),
    supabase.from("olimpiada_stats_marca").select("olimpiada_sigla, olimpiada_nome"),
  ]);

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

  type OlimpiadaOpcao = { sigla: string; nome: string; nivel?: string };
  const opcoes = new Map<string, OlimpiadaOpcao>();
  for (const o of OLIMPIADAS_NACIONAIS) {
    if (siglasComDados.has(o.sigla)) opcoes.set(o.sigla.toUpperCase(), { ...o });
  }
  // Siglas que só existem na camada de agregados (histórico importado) também
  // precisam ser selecionáveis — senão o dado carregado fica inalcançável.
  for (const s of siglasAgregadas ?? []) {
    const chave = s.olimpiada_sigla.toUpperCase();
    if (opcoes.has(chave)) continue;
    // "SIGLA ANO — Nome" → "Nome"
    const nome = s.olimpiada_nome.split("—").slice(1).join("—").trim() || s.olimpiada_nome;
    opcoes.set(chave, { sigla: s.olimpiada_sigla, nome });
  }
  const olimpiadasDisponiveis = [...opcoes.values()].sort((a, b) =>
    a.sigla.localeCompare(b.sigla, "pt-BR"),
  );

  // Redirect para a primeira olimpíada quando nenhuma (ou múltiplas) estiver selecionada
  const isNoSelection = olimpiadaParam === "todas" || olimpiadaParam.includes(",");
  if (isNoSelection && olimpiadasDisponiveis.length > 0) {
    const params = new URLSearchParams();
    if (sp.marca) params.set("marca", sp.marca);
    if (sp.anos) params.set("anos", sp.anos);
    params.set("olimpiada", olimpiadasDisponiveis[0]!.sigla);
    redirect(`/olimpiadas?${params.toString()}`);
  }

  // A partir daqui, olimpiadaParam é sempre uma sigla válida e única
  const selectedOlimpiadas = [olimpiadaParam];

  // Passo 2: marcas e stats em paralelo
  const [{ data: marcas }, { data: statsData }] = await Promise.all([
    supabase.from("marca").select("id, nome").order("nome"),
    supabase.rpc("get_olimpiadas_stats", {
      p_anos: selectedYears,
      p_marcas: marcaTodosMode ? [] : selectedMarcas,
      p_siglas: selectedOlimpiadas,
    }),
  ]);

  const statsRows: OlimpiadaStats[] = (statsData ?? [])
    .map((row) => ({
      nome: row.olimpiada_nome ?? "—",
      marca: row.marca_nome ?? "—",
      anoLetivo: Number(row.ano_letivo),
      inscritos: Number(row.inscritos),
      participantes: Number(row.participantes),
      ouro: Number(row.ouro),
      prata: Number(row.prata),
      bronze: Number(row.bronze),
      mencao: Number(row.mencao),
    }))
    .sort((a, b) => {
      const marcaCmp = a.marca.localeCompare(b.marca, "pt-BR");
      if (marcaCmp !== 0) return marcaCmp;
      const nomeCmp = a.nome.localeCompare(b.nome, "pt-BR");
      if (nomeCmp !== 0) return nomeCmp;
      return a.anoLetivo - b.anoLetivo;
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

  const labelClass = "shrink-0 text-xs font-semibold uppercase tracking-wider";
  const labelStyle = { color: "rgb(91,184,193)" };

  const filterSlot = (
    <>
      <div className="flex items-center gap-2">
        <span className={labelClass} style={labelStyle}>
          Marca
        </span>
        <MarcaMultiSelect marcas={marcas ?? []} />
      </div>
      <div className="flex items-center gap-2">
        <span className={labelClass} style={labelStyle}>
          Olimpíada
        </span>
        <OlimpiadaMultiSelect olimpiadas={olimpiadasDisponiveis} />
      </div>
      <div className="flex items-center gap-2">
        <span className={labelClass} style={labelStyle}>
          Ano
        </span>
        <YearMultiSelect
          anos={anosDisponiveis}
          selected={selectedYears}
          todosMode={todosModeAnos}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Participação por marca, olimpíada e ano
        </p>
      </div>
      <OlimpiadasTable statsRows={statsRows} totals={totals} filterSlot={filterSlot} />
    </div>
  );
}
