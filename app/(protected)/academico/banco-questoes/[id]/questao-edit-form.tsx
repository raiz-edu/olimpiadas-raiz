"use client";

import { useActionState } from "react";
import { atualizarQuestao } from "../actions";
import { inputClass, selectClass } from "@/components/ui/form-field";
import type { Questao } from "@/lib/types/database";
import { EnunciadoBlocosEditor, type BlocoEnunciado } from "../enunciado-blocos-editor";

export function QuestaoEditForm({ questao }: { questao: Questao }) {
  const action = atualizarQuestao.bind(null, questao.id);
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state && "ok" in state && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          Salvo com sucesso.
        </div>
      )}

      {/* datalists de sugestões */}
      <datalist id="dl-olimpiada-edit">
        <option value="obmep" />
        <option value="obmep_mirim" />
        <option value="obm" />
        <option value="obf" />
        <option value="obi" />
        <option value="obq" />
        <option value="onhb" />
        <option value="oba" />
        <option value="obr" />
      </datalist>
      <datalist id="dl-nivel-edit">
        <option value="nivel_1" />
        <option value="nivel_2" />
        <option value="nivel_3" />
        <option value="mirim" />
      </datalist>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Olimpíada
          </label>
          <input
            name="olimpiada"
            type="text"
            list="dl-olimpiada-edit"
            defaultValue={questao.olimpiada}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nível
          </label>
          <input
            name="nivel"
            type="text"
            list="dl-nivel-edit"
            defaultValue={questao.nivel ?? ""}
            placeholder="ex: nivel_1, mirim…"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fase
          </label>
          <input
            name="fase"
            type="number"
            min={1}
            defaultValue={questao.fase}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ano
          </label>
          <input name="ano" type="number" defaultValue={questao.ano} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nº
          </label>
          <input name="numero" type="number" defaultValue={questao.numero} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tipo
          </label>
          <select name="tipo" defaultValue={questao.tipo} className={selectClass}>
            <option value="multipla_escolha">M. Escolha</option>
            <option value="aberta">Aberta</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Assunto
        </label>
        <input
          name="assunto"
          type="text"
          defaultValue={questao.assunto ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Enunciado
        </label>
        <EnunciadoBlocosEditor
          initialBlocos={
            questao.enunciado_blocos
              ? (questao.enunciado_blocos as BlocoEnunciado[])
              : questao.imagem_url
                ? ([
                    { tipo: "texto", conteudo: questao.enunciado },
                    { tipo: "imagem", url: questao.imagem_url },
                  ] as BlocoEnunciado[])
                : null
          }
          initialEnunciado={questao.enunciado}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
