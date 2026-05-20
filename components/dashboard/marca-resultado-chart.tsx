"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export type MarcaChartData = {
  nome: string;
  ouro: number;
  prata: number;
  bronze: number;
  mencao_honrosa: number;
};

export function MarcaResultadoChart({ data }: { data: MarcaChartData[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Resultados por marca</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="30%" barGap={2}>
          <XAxis
            dataKey="nome"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: 8,
              color: "#f1f5f9",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 12 }} />
          <Bar dataKey="ouro" name="Ouro" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="prata" name="Prata" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="bronze" name="Bronze" fill="#B45309" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="mencao_honrosa"
            name="Honra ao Mérito"
            fill="#6366F1"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
