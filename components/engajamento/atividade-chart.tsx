"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function rotuloDia(dia: string) {
  const [, mes, data] = dia.split("-");
  return `${data}/${mes}`;
}

export function AtividadeChart({ dados }: { dados: { dia: string; alunos: number }[] }) {
  return (
    <div className="min-w-0">
      {dados.some((d) => d.alunos > 0) ? (
        <div
          className="h-52 w-full"
          role="group"
          aria-label="Alunos com respostas por dia. Os valores estão disponíveis na tabela abaixo."
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={dados}
              margin={{ top: 12, right: 4, bottom: 0, left: -22 }}
              accessibilityLayer
            >
              <CartesianGrid stroke="#334155" vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="dia"
                tickFormatter={rotuloDia}
                minTickGap={24}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(dia) => rotuloDia(String(dia))}
                formatter={(valor) => [
                  Number(valor).toLocaleString("pt-BR"),
                  "Alunos com respostas",
                ]}
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #475569",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 12,
                }}
                cursor={{ fill: "#334155", opacity: 0.4 }}
              />
              <Bar dataKey="alunos" fill="#5bb8c1" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          Nenhuma resposta registrada neste período e recorte.
        </p>
      )}
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          Ver valores por dia
        </summary>
        <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <caption className="sr-only">
              Alunos distintos que responderam questões em cada dia, no horário de São Paulo
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2">
                  Dia
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Alunos
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.dia} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-1.5">{rotuloDia(d.dia)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.alunos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
