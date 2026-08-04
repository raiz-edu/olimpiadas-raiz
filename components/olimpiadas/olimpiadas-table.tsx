"use client";

import { useState, type ReactNode } from "react";
import { BarChart, Bar, LabelList, XAxis, Tooltip, Legend } from "recharts";

export type OlimpiadaStats = {
  nome: string;
  marca: string;
  anoLetivo: number;
  inscritos: number;
  participantes: number;
  ouro: number;
  prata: number;
  bronze: number;
  mencao: number;
  classificados: number;
};

type Totals = {
  inscritos: number;
  participantes: number;
  ouro: number;
  prata: number;
  bronze: number;
  mencao: number;
  classificados: number;
};

type Props = {
  statsRows: OlimpiadaStats[];
  totals: Totals;
  filterSlot?: ReactNode;
};

type ColKey =
  | "inscritos"
  | "participantes"
  | "engajamento"
  | "ouro"
  | "prata"
  | "bronze"
  | "mencao"
  | "classificados";

const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "inscritos", label: "Inscritos" },
  { key: "participantes", label: "Participantes" },
  { key: "engajamento", label: "Engajamento" },
  { key: "ouro", label: "Ouro" },
  { key: "prata", label: "Prata" },
  { key: "bronze", label: "Bronze" },
  { key: "mencao", label: "Menção Honrosa" },
  { key: "classificados", label: "Classificados" },
];

const ACTIVE_STYLE: Record<ColKey, string> = {
  inscritos: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  participantes: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  engajamento: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  ouro: "bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/40",
  prata: "bg-slate-300/10 text-slate-300 ring-1 ring-slate-300/40",
  bronze: "bg-amber-600/10 text-amber-600 ring-1 ring-amber-600/40",
  mencao: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  classificados: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/40",
};

const COL_COLOR: Record<ColKey, string> = {
  inscritos: "rgb(91,184,193)",
  participantes: "rgb(91,184,193)",
  engajamento: "rgb(91,184,193)",
  ouro: "rgb(250,204,21)",
  prata: "rgb(203,213,225)",
  bronze: "rgb(217,119,6)",
  mencao: "rgb(91,184,193)",
  classificados: "rgb(52,211,153)",
};

// Cores fixas por ano — garantem que 2025 é sempre laranja, 2026 sempre roxo,
// independente de quais anos estão selecionados no filtro.
const YEAR_COLOR: Record<string, string> = {
  "2021": "rgb(148,163,184)",
  "2022": "rgb(52,211,153)",
  "2023": "rgb(59,130,246)",
  "2024": "rgb(91,184,193)",
  "2025": "rgb(249,115,22)",
  "2026": "rgb(168,85,247)",
};
const FALLBACK_COLORS = ["rgb(34,197,94)", "rgb(234,179,8)", "rgb(239,68,68)", "rgb(236,72,153)"];
// Extrai o ano de um label de série (ex: "OBMEP 2024" → "2024", "2024" → "2024")
function yearFromLabel(label: string): string {
  return label.match(/\b(20\d\d)\b/)?.[1] ?? label;
}
function yearColor(label: string, idx: number): string {
  const ano = yearFromLabel(label);
  return YEAR_COLOR[ano] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length] ?? "rgb(91,184,193)";
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// Extrai sigla do nome para exibição com ano (remove parte após " — ")
function siglaFull(nome: string): string {
  const idx = nome.indexOf(" — ");
  return idx !== -1 ? nome.substring(0, idx) : nome;
}

// Extrai sigla-base sem o ano para agrupamento de gráficos
function sigla(nome: string): string {
  const s = siglaFull(nome);
  return s.replace(/\s*\b20\d\d\b\s*/, "").trim() || s;
}

function fmt(n: number) {
  return n === 0 ? "—" : n.toLocaleString("pt-BR");
}

function engajamento(participantes: number, inscritos: number) {
  if (inscritos === 0) return "—";
  return `${Math.round((participantes / inscritos) * 100)}%`;
}

function cellValue(row: OlimpiadaStats, col: ColKey): number {
  if (col === "engajamento")
    return row.inscritos === 0 ? 0 : Math.round((row.participantes / row.inscritos) * 100);
  return row[col as keyof OlimpiadaStats] as number;
}

// ─── chart data builders ──────────────────────────────────────────────────────

type ChartPoint = Record<string, string | number | null>;

// Agrega col para um conjunto de rows; retorna null quando não há dados
function aggregate(matching: OlimpiadaStats[], col: ColKey): number | null {
  if (matching.length === 0) return null;
  if (col === "engajamento") {
    const totIns = matching.reduce((s, r) => s + r.inscritos, 0);
    const totPar = matching.reduce((s, r) => s + r.participantes, 0);
    return totIns === 0 ? 0 : Math.round((totPar / totIns) * 100);
  }
  return matching.reduce((s, r) => s + cellValue(r, col), 0);
}

// X = marca, barras = ano — comparação entre marcas (agrega olimpíadas selecionadas)
function toGroupedByMarca(
  rows: OlimpiadaStats[],
  col: ColKey,
): { data: ChartPoint[]; series: string[] } {
  const marcas = [...new Set(rows.map((r) => r.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  // Recharts posiciona barras pela ordem de inserção das chaves no data object.
  // Sort ascendente → "OBMEP 2024" é inserida primeiro → fica à esquerda.
  const anosNums = [...new Set(rows.map((r) => r.anoLetivo))].sort((a, b) => a - b);

  // Quando só uma olimpíada está presente → legenda mostra "OBMEP 2024"; senão só "2024"
  const siglas = new Set(rows.map((r) => sigla(r.nome)));
  const prefix = siglas.size === 1 ? `${[...siglas][0]} ` : "";
  const series = anosNums.map((a) => `${prefix}${a}`);

  const data = marcas.map((marca) => {
    const entry: ChartPoint = { name: marca };
    for (let i = 0; i < anosNums.length; i++) {
      const label = series[i] ?? String(anosNums[i]);
      entry[label] = aggregate(
        rows.filter((r) => r.marca === marca && r.anoLetivo === anosNums[i]),
        col,
      );
    }
    return entry;
  });
  return { data, series };
}

//─── sub-components ────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "rgb(15,23,42)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: { color: "rgb(148,163,184)", marginBottom: 4 },
  cursor: { fill: "rgba(255,255,255,0.03)" },
};

function GroupedBar({
  data,
  series,
  isPercent,
}: {
  data: ChartPoint[];
  series: string[];
  isPercent: boolean;
}) {
  const BAR_W = 44;
  const GROUP_GAP = 16;
  const ML = 8;
  const MR = 16;

  // width fitted to content; each group gets at least 96px so labels don't clip
  const contentW = Math.max(
    data.length * series.length * BAR_W + Math.max(0, data.length - 1) * GROUP_GAP,
    data.length * 96 + Math.max(0, data.length - 1) * GROUP_GAP,
  );
  const chartW = contentW + ML + MR;

  return (
    <div className="flex justify-center overflow-x-auto">
      <BarChart
        key={series.join("|")}
        width={chartW}
        height={220}
        data={data}
        barGap={0}
        barCategoryGap={GROUP_GAP}
        margin={{ top: 28, right: MR, left: ML, bottom: 8 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "rgb(148,163,184)", fontWeight: 500 }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => {
            if (v === null || v === undefined) return ["—", name as string];
            const n = Number(v);
            return [isPercent ? `${n}%` : n.toLocaleString("pt-BR"), name as string];
          }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 14 }}
          content={({ payload }) => (
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              {[...(payload ?? [])].reverse().map((entry) => (
                <span
                  key={entry.value as string}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: "rgb(148,163,184)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: entry.color as string,
                    }}
                  />
                  {entry.value as string}
                </span>
              ))}
            </div>
          )}
        />
        {series.map((s, i) => (
          <Bar
            key={`${i}:${s}`}
            dataKey={s}
            fill={yearColor(s, i)}
            barSize={BAR_W}
            radius={[4, 4, 0, 0]}
          >
            <LabelList
              dataKey={s}
              position="top"
              style={{ fill: "rgb(226,232,240)", fontSize: 11, fontWeight: 600 }}
              formatter={(v: unknown) => {
                if (v === null || v === undefined) return "";
                const n = Number(v);
                return n === 0 ? "" : isPercent ? `${n}%` : n.toLocaleString("pt-BR");
              }}
            />
          </Bar>
        ))}
      </BarChart>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────

export function OlimpiadasTable({ statsRows, totals, filterSlot }: Props) {
  const [visible, setVisible] = useState<Record<ColKey, boolean>>({
    inscritos: true,
    participantes: true,
    engajamento: true,
    ouro: true,
    prata: true,
    bronze: true,
    mencao: true,
    // Desligada por padrão: hoje só 3 das 10 marcas reportam classificados na
    // origem, então ligada por padrão a coluna sugere comparação entre marcas
    // que o dado não sustenta. Fica disponível para quem for investigar.
    classificados: false,
  });
  const [tableOpen, setTableOpen] = useState(false);

  function toggle(key: ColKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const isEmpty = statsRows.length === 0;

  return (
    <div className="space-y-4">
      {/* Painel de controles: filtros + seletor de colunas no mesmo card */}
      <div className="rounded-xl border border-border bg-card">
        {filterSlot && (
          <>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">{filterSlot}</div>
            <div className="h-px bg-border" />
          </>
        )}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span
            className="shrink-0 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgb(91,184,193)" }}
          >
            Colunas
          </span>
          <div className="h-4 w-px shrink-0 bg-border" />
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                type="button"
                onClick={() => toggle(col.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  visible[col.key]
                    ? ACTIVE_STYLE[col.key]
                    : "text-muted-foreground/40 ring-1 ring-border/40 hover:text-muted-foreground hover:ring-border"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state — filtros continuam visíveis para o usuário ajustar a seleção */}
      {isEmpty && (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma inscrição encontrada para os filtros selecionados.
          </p>
        </div>
      )}

      {/* Table — collapsible, só quando há dados */}
      {!isEmpty && (
        <div className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setTableOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Planilha de dados</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${tableOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {tableOpen && (
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: "rgb(91,184,193)" }}
                    >
                      Marca
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: "rgb(91,184,193)" }}
                    >
                      Olimpíada
                    </th>
                    <th
                      className="px-4 py-3 text-right font-medium"
                      style={{ color: "rgb(91,184,193)" }}
                    >
                      Ano
                    </th>
                    {visible.inscritos && (
                      <th
                        className="px-4 py-3 text-right font-medium"
                        style={{ color: "rgb(91,184,193)" }}
                      >
                        Inscritos
                      </th>
                    )}
                    {visible.participantes && (
                      <th
                        className="px-4 py-3 text-right font-medium"
                        style={{ color: "rgb(91,184,193)" }}
                      >
                        Participantes
                      </th>
                    )}
                    {visible.engajamento && (
                      <th
                        className="px-4 py-3 text-right font-medium"
                        style={{ color: "rgb(91,184,193)" }}
                      >
                        Engajamento
                      </th>
                    )}
                    {visible.ouro && (
                      <th className="px-4 py-3 text-right font-medium text-yellow-400">Ouro</th>
                    )}
                    {visible.prata && (
                      <th className="px-4 py-3 text-right font-medium text-slate-300">Prata</th>
                    )}
                    {visible.bronze && (
                      <th className="px-4 py-3 text-right font-medium text-amber-600">Bronze</th>
                    )}
                    {visible.mencao && (
                      <th
                        className="px-4 py-3 text-right font-medium"
                        style={{ color: "rgb(91,184,193)" }}
                      >
                        Menção
                      </th>
                    )}
                    {visible.classificados && (
                      <th className="px-4 py-3 text-right font-medium text-emerald-400">
                        Classificados
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statsRows.map((r) => (
                    <tr
                      key={`${r.marca}::${r.nome}::${r.anoLetivo}`}
                      className="hover:bg-background/50"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{r.marca}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sigla(r.nome)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.anoLetivo}</td>
                      {visible.inscritos && (
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {r.inscritos.toLocaleString("pt-BR")}
                        </td>
                      )}
                      {visible.participantes && (
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {fmt(r.participantes)}
                        </td>
                      )}
                      {visible.engajamento && (
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {engajamento(r.participantes, r.inscritos)}
                        </td>
                      )}
                      {visible.ouro && (
                        <td className="px-4 py-3 text-right text-yellow-400">{fmt(r.ouro)}</td>
                      )}
                      {visible.prata && (
                        <td className="px-4 py-3 text-right text-slate-300">{fmt(r.prata)}</td>
                      )}
                      {visible.bronze && (
                        <td className="px-4 py-3 text-right text-amber-600">{fmt(r.bronze)}</td>
                      )}
                      {visible.mencao && (
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {fmt(r.mencao)}
                        </td>
                      )}
                      {visible.classificados && (
                        <td className="px-4 py-3 text-right text-emerald-400">
                          {fmt(r.classificados)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-background font-semibold">
                    <td className="px-4 py-3 text-foreground">Total</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    {visible.inscritos && (
                      <td className="px-4 py-3 text-right text-foreground">
                        {totals.inscritos.toLocaleString("pt-BR")}
                      </td>
                    )}
                    {visible.participantes && (
                      <td className="px-4 py-3 text-right text-foreground">
                        {fmt(totals.participantes)}
                      </td>
                    )}
                    {visible.engajamento && (
                      <td className="px-4 py-3 text-right text-foreground">
                        {engajamento(totals.participantes, totals.inscritos)}
                      </td>
                    )}
                    {visible.ouro && (
                      <td className="px-4 py-3 text-right text-yellow-400">{fmt(totals.ouro)}</td>
                    )}
                    {visible.prata && (
                      <td className="px-4 py-3 text-right text-slate-300">{fmt(totals.prata)}</td>
                    )}
                    {visible.bronze && (
                      <td className="px-4 py-3 text-right text-amber-600">{fmt(totals.bronze)}</td>
                    )}
                    {visible.mencao && (
                      <td className="px-4 py-3 text-right text-foreground">{fmt(totals.mencao)}</td>
                    )}
                    {visible.classificados && (
                      <td className="px-4 py-3 text-right text-emerald-400">
                        {fmt(totals.classificados)}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charts — X = Marca, barras = Ano (agrega todas as olimpíadas selecionadas) */}
      {!isEmpty &&
        COLUMNS.filter((c) => visible[c.key]).map((col) => {
          const color = COL_COLOR[col.key];
          const isPercent = col.key === "engajamento";
          const chart = toGroupedByMarca(statsRows, col.key);

          return (
            <div key={col.key} className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-semibold" style={{ color }}>
                {col.label}
              </p>
              <GroupedBar data={chart.data} series={chart.series} isPercent={isPercent} />
            </div>
          );
        })}
    </div>
  );
}
