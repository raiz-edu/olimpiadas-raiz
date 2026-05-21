"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type OlimpiadaStats = {
  nome: string;
  marca: string;
  inscritos: number;
  participantes: number;
  ouro: number;
  prata: number;
  bronze: number;
  mencao: number;
};

type Totals = {
  inscritos: number;
  participantes: number;
  ouro: number;
  prata: number;
  bronze: number;
  mencao: number;
};

type Props = {
  statsRows: OlimpiadaStats[];
  totals: Totals;
};

type ColKey =
  | "inscritos"
  | "participantes"
  | "engajamento"
  | "ouro"
  | "prata"
  | "bronze"
  | "mencao";

const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "inscritos", label: "Inscritos" },
  { key: "participantes", label: "Participantes" },
  { key: "engajamento", label: "Engajamento" },
  { key: "ouro", label: "Ouro" },
  { key: "prata", label: "Prata" },
  { key: "bronze", label: "Bronze" },
  { key: "mencao", label: "Menção Honrosa" },
];

const ACTIVE_STYLE: Record<ColKey, string> = {
  inscritos: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  participantes: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  engajamento: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
  ouro: "bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/40",
  prata: "bg-slate-300/10 text-slate-300 ring-1 ring-slate-300/40",
  bronze: "bg-amber-600/10 text-amber-600 ring-1 ring-amber-600/40",
  mencao: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40",
};

const COL_COLOR: Record<ColKey, string> = {
  inscritos: "rgb(91,184,193)",
  participantes: "rgb(91,184,193)",
  engajamento: "rgb(91,184,193)",
  ouro: "rgb(250,204,21)",
  prata: "rgb(203,213,225)",
  bronze: "rgb(217,119,6)",
  mencao: "rgb(91,184,193)",
};

const SERIES_COLORS = [
  "rgb(91,184,193)",
  "rgb(249,115,22)",
  "rgb(168,85,247)",
  "rgb(34,197,94)",
  "rgb(234,179,8)",
  "rgb(239,68,68)",
  "rgb(59,130,246)",
  "rgb(236,72,153)",
];

// ─── helpers ───────────────────────────────────────────────────────────────

function sigla(nome: string) {
  const idx = nome.indexOf(" — ");
  return idx !== -1 ? nome.substring(0, idx) : nome;
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

// ─── chart data builders ───────────────────────────────────────────────────

type ChartPoint = Record<string, string | number>;

// X = marca, one bar per olimpíada
function toGroupedByMarca(
  rows: OlimpiadaStats[],
  col: ColKey,
): { data: ChartPoint[]; series: string[] } {
  const marcas = [...new Set(rows.map((r) => r.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const olimps = [...new Set(rows.map((r) => sigla(r.nome)))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  const data = marcas.map((marca) => {
    const entry: ChartPoint = { name: marca };
    for (const olimp of olimps) {
      const row = rows.find((r) => r.marca === marca && sigla(r.nome) === olimp);
      entry[olimp] = row ? cellValue(row, col) : 0;
    }
    return entry;
  });

  return { data, series: olimps };
}

// X = olimpíada, one bar per marca
function toGroupedByOlimp(
  rows: OlimpiadaStats[],
  col: ColKey,
): { data: ChartPoint[]; series: string[] } {
  const marcas = [...new Set(rows.map((r) => r.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const olimps = [...new Set(rows.map((r) => sigla(r.nome)))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  const data = olimps.map((olimp) => {
    const entry: ChartPoint = { name: olimp };
    for (const marca of marcas) {
      const row = rows.find((r) => r.marca === marca && sigla(r.nome) === olimp);
      entry[marca] = row ? cellValue(row, col) : 0;
    }
    return entry;
  });

  return { data, series: marcas };
}

// ─── sub-components ────────────────────────────────────────────────────────

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
  const height = series.length > 3 ? 220 : 180;
  const maxBarSize = series.length <= 1 ? 52 : series.length <= 3 ? 32 : 20;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "rgb(148,163,184)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(148,163,184)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={isPercent ? (v: number) => `${v}%` : undefined}
          allowDecimals={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => {
            const n = Number(v ?? 0);
            return [isPercent ? `${n}%` : n.toLocaleString("pt-BR"), name as string];
          }}
        />
        <Legend
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: "rgb(148,163,184)", fontSize: 10 }}>{value}</span>
          )}
        />
        {series.map((s, i) => (
          <Bar
            key={s}
            dataKey={s}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
            radius={[3, 3, 0, 0]}
            maxBarSize={maxBarSize}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── main component ────────────────────────────────────────────────────────

export function OlimpiadasTable({ statsRows, totals }: Props) {
  const [visible, setVisible] = useState<Record<ColKey, boolean>>({
    inscritos: true,
    participantes: true,
    engajamento: true,
    ouro: true,
    prata: true,
    bronze: true,
    mencao: true,
  });

  function toggle(key: ColKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (statsRows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma inscrição encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Column toggles */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left font-medium" style={{ color: "rgb(91,184,193)" }}>
                Marca
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "rgb(91,184,193)" }}>
                Olimpíada
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {statsRows.map((r) => (
              <tr key={`${r.marca}::${r.nome}`} className="hover:bg-background/50">
                <td className="px-4 py-3 font-medium text-foreground">{r.marca}</td>
                <td className="px-4 py-3 text-muted-foreground">{sigla(r.nome)}</td>
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
                  <td className="px-4 py-3 text-right text-muted-foreground">{fmt(r.mencao)}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-background font-semibold">
              <td className="px-4 py-3 text-foreground">Total</td>
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
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts — grouped bars: Por marca (series=olimpíadas) + Por olimpíada (series=marcas) */}
      {COLUMNS.filter((c) => visible[c.key]).map((col) => {
        const color = COL_COLOR[col.key];
        const isPercent = col.key === "engajamento";
        const byMarca = toGroupedByMarca(statsRows, col.key);
        const byOlimp = toGroupedByOlimp(statsRows, col.key);

        return (
          <div key={col.key} className="rounded-xl border border-border bg-card p-5">
            <p className="mb-5 text-sm font-semibold" style={{ color }}>
              {col.label}
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Por marca
                </p>
                <GroupedBar data={byMarca.data} series={byMarca.series} isPercent={isPercent} />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Por olimpíada
                </p>
                <GroupedBar data={byOlimp.data} series={byOlimp.series} isPercent={isPercent} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
