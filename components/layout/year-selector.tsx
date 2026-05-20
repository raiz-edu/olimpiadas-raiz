"use client";

import { useTransition } from "react";
import { setAnoAnalise } from "@/lib/auth/ano-analise";

export function YearSelector({ anos, anoAtual }: { anos: number[]; anoAtual: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={anoAtual}
      disabled={pending}
      onChange={(e) => {
        const ano = parseInt(e.target.value, 10);
        startTransition(() => setAnoAnalise(ano));
      }}
      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none transition-opacity disabled:opacity-50"
      aria-label="Ano de análise"
    >
      {anos.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}
