"use client";

import { useActionState } from "react";
import { salvarSolucao } from "../actions";
import { inputClass } from "@/components/ui/form-field";
import type { Solucao } from "@/lib/types/database";

export function SolucaoEditor({ questaoId, solucao }: { questaoId: string; solucao?: Solucao | null }) {
  const [state, action, isPending] = useActionState(salvarSolucao, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="questao_id" value={questaoId} />

      {state && "error" in state && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</div>
      )}
      {state && "ok" in state && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">Resolução salva.</div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolução em texto</label>
        <textarea name="texto" rows={6} defaultValue={solucao?.texto ?? ""} placeholder="Digite a resolução completa da questão…" className={inputClass} />
      </div>

      <p className="text-xs text-muted-foreground">
        O URL do vídeo de resolução é configurado na seção &ldquo;Dados da questão&rdquo; acima (campo URL Vídeo).
      </p>

      <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {isPending ? "Salvando…" : "Salvar resolução"}
      </button>
    </form>
  );
}
