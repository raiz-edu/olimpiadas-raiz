"use client";

import { useActionState } from "react";
import { atualizarQuestao } from "../actions";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { TopicoSubtopicoSelect } from "@/components/academico/topico-subtopico-select";
import type { Questao } from "@/lib/types/database";
import { EnunciadoBlocosEditor, type BlocoEnunciado } from "../enunciado-blocos-editor";

const DIFICULDADE_OPTIONS = [
  { value: "elementar", label: "Elementar" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito Difícil" },
];

const PUBLICO_OPTIONS = [
  { value: "EFAI", label: "EFAI" },
  { value: "EFAF", label: "EFAF" },
  { value: "EM", label: "EM" },
  { value: "Todos", label: "Todos" },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  publicado: { label: "Publicado", className: "bg-emerald-500/10 text-emerald-400" },
  aguardando_revisao: { label: "Aguardando revisão", className: "bg-amber-500/10 text-amber-400" },
};

export function QuestaoEditForm({ questao }: { questao: Questao }) {
  const action = atualizarQuestao.bind(null, questao.id);
  const [state, formAction, isPending] = useActionState(action, null);

  const statusInfo = STATUS_LABELS[questao.status_cadastro] ?? {
    label: "Publicado",
    className: "bg-emerald-500/10 text-emerald-400",
  };

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

      {/* Badge de status de cadastro */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

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
        <option value="junior" />
        <option value="senior" />
      </datalist>

      {/* Linha 1: Olimpíada + Nível/Categoria */}
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
            Nível/Categoria
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

      {/* Linha 2: Fase · Ano · Nº · Tipo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fase
          </label>
          <input
            name="fase"
            type="number"
            defaultValue={questao.fase ?? ""}
            placeholder="opcional"
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
          <input
            name="numero"
            type="number"
            defaultValue={questao.numero ?? ""}
            placeholder="opcional"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tipo
          </label>
          <select name="tipo" defaultValue={questao.tipo} className={selectClass}>
            <option value="multipla_escolha">M. Escolha</option>
            <option value="aberta">Aberta</option>
            <option value="verdadeiro_ou_falso">V ou F</option>
          </select>
        </div>
      </div>

      {/* Linha 3: Tópico + Subtópico (taxonomia canônica) */}
      <TopicoSubtopicoSelect
        defaultTopico={questao.topico ?? null}
        defaultSubtopico={questao.subtopico ?? null}
        labelClass="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
      />

      {/* Linha 4: Dificuldade + Público-alvo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dificuldade
          </label>
          <select
            name="dificuldade"
            defaultValue={questao.dificuldade ?? ""}
            className={selectClass}
          >
            <option value="">Não definido</option>
            {DIFICULDADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Público-alvo
          </label>
          <select
            name="publico_alvo"
            defaultValue={questao.publico_alvo ?? ""}
            className={selectClass}
          >
            <option value="">Não definido</option>
            {PUBLICO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enunciado */}
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
