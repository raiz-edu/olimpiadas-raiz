"use client";

import { useActionState } from "react";
import { salvarAlternativa } from "../actions";
import { inputClass } from "@/components/ui/form-field";
import type { Alternativa } from "@/lib/types/database";

const LETRAS = ["A", "B", "C", "D", "E"];

export function AlternativasEditor({
  questaoId,
  alternativas,
  stats,
}: {
  questaoId: string;
  alternativas: Alternativa[];
  stats: { correta: boolean; alternativa_id: string | null }[];
}) {
  const altMap = Object.fromEntries(alternativas.map((a) => [a.letra, a]));

  return (
    <div className="space-y-3">
      {LETRAS.map((letra) => {
        const alt = altMap[letra];
        const count = stats.filter((s) => s.alternativa_id === alt?.id).length;
        return (
          <AlternativaRow
            key={letra}
            letra={letra}
            questaoId={questaoId}
            alternativa={alt}
            count={count}
            totalStats={stats.length}
          />
        );
      })}
    </div>
  );
}

function AlternativaRow({
  letra,
  questaoId,
  alternativa,
  count,
  totalStats,
}: {
  letra: string;
  questaoId: string;
  alternativa?: Alternativa;
  count: number;
  totalStats: number;
}) {
  const [, action, isPending] = useActionState(salvarAlternativa, null);

  return (
    <form action={action} className="flex items-start gap-3">
      <input type="hidden" name="questao_id" value={questaoId} />
      <input type="hidden" name="letra" value={letra} />

      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${alternativa?.correta ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-border text-muted-foreground"}`}>
        {letra}
      </div>

      <input
        name="texto"
        defaultValue={alternativa?.texto ?? ""}
        placeholder={`Texto da alternativa ${letra}`}
        className={`${inputClass} flex-1`}
      />

      <div className="flex items-center gap-2 mt-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            name="correta"
            value="true"
            defaultChecked={alternativa?.correta ?? false}
            className="h-4 w-4 rounded"
          />
          Correta
        </label>
      </div>

      <button type="submit" disabled={isPending} className="mt-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40">
        {isPending ? "…" : "Salvar"}
      </button>

      {totalStats > 0 && (
        <span className="mt-2 text-xs text-muted-foreground w-10 text-center">
          {count}×
        </span>
      )}
    </form>
  );
}
