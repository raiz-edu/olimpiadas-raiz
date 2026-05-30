"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarQuestao } from "../actions";
import { inputClass, selectClass } from "@/components/ui/form-field";

export default function NovaBancoQuestaoPage() {
  const [state, action, isPending] = useActionState(criarQuestao, null);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/academico/banco-questoes" className="hover:text-foreground">Banco de Questões</Link>
        <span>/</span>
        <span className="text-foreground">Nova Questão</span>
      </div>

      <h1 className="mb-6 text-xl font-bold text-foreground">Nova Questão</h1>

      {state && "error" in state && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Olimpíada *</label>
            <select name="olimpiada" required className={selectClass}>
              <option value="">Selecione</option>
              <option value="obmep">OBMEP (N1 / N2 / N3)</option>
              <option value="obmep_mirim">OBMEP Mirim</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Nível</label>
            <select name="nivel" className={selectClass}>
              <option value="">— (Mirim não tem nível)</option>
              <option value="nivel_1">Nível 1</option>
              <option value="nivel_2">Nível 2</option>
              <option value="nivel_3">Nível 3</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Fase *</label>
            <select name="fase" required className={selectClass}>
              <option value="">Selecione</option>
              <option value="1">1ª Fase</option>
              <option value="2">2ª Fase</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Ano *</label>
            <input name="ano" type="number" min={2000} max={2100} placeholder="2024" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Número *</label>
            <input name="numero" type="number" min={1} placeholder="1" required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Tipo</label>
            <select name="tipo" className={selectClass}>
              <option value="multipla_escolha">Múltipla escolha</option>
              <option value="aberta">Aberta (dissertativa)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Assunto</label>
            <input name="assunto" type="text" placeholder="ex: Geometria, Aritmética…" className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Enunciado *</label>
          <textarea name="enunciado" required rows={5} placeholder="Digite o enunciado da questão…" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">URL do vídeo de resolução</label>
          <input name="video_url" type="url" placeholder="https://youtube.com/…" className={inputClass} />
          <p className="text-xs text-muted-foreground">YouTube, Vimeo ou link direto. Pode ser preenchido depois.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {isPending ? "Salvando…" : "Criar questão"}
          </button>
          <Link href="/academico/banco-questoes" className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
