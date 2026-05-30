"use client";

import { useActionState } from "react";
import { atualizarQuestao } from "../actions";
import { inputClass, selectClass } from "@/components/ui/form-field";
import type { Questao } from "@/lib/types/database";

export function QuestaoEditForm({ questao }: { questao: Questao }) {
  const action = atualizarQuestao.bind(null, questao.id);
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</div>
      )}
      {state && "ok" in state && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">Salvo com sucesso.</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Olimpíada</label>
          <select name="olimpiada" defaultValue={questao.olimpiada} className={selectClass}>
            <option value="obmep">OBMEP</option>
            <option value="obmep_mirim">OBMEP Mirim</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível</label>
          <select name="nivel" defaultValue={questao.nivel ?? ""} className={selectClass}>
            <option value="">— (sem nível)</option>
            <option value="nivel_1">Nível 1</option>
            <option value="nivel_2">Nível 2</option>
            <option value="nivel_3">Nível 3</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fase</label>
          <select name="fase" defaultValue={questao.fase} className={selectClass}>
            <option value="1">1ª</option>
            <option value="2">2ª</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ano</label>
          <input name="ano" type="number" defaultValue={questao.ano} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nº</label>
          <input name="numero" type="number" defaultValue={questao.numero} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
          <select name="tipo" defaultValue={questao.tipo} className={selectClass}>
            <option value="multipla_escolha">M. Escolha</option>
            <option value="aberta">Aberta</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assunto</label>
        <input name="assunto" type="text" defaultValue={questao.assunto ?? ""} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enunciado</label>
        <textarea name="enunciado" rows={6} defaultValue={questao.enunciado} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL Vídeo de Resolução</label>
        <input name="video_url" type="url" defaultValue={questao.video_url ?? ""} placeholder="https://youtube.com/…" className={inputClass} />
      </div>

      <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {isPending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
