"use client";

import { useActionState } from "react";
import { criarFase } from "../actions";
import { FormField } from "@/components/ui/form-field";

const TIPOS_FASE = [
  { value: "inscricao", label: "Inscrição" },
  { value: "prova_1", label: "Prova 1" },
  { value: "prova_2", label: "Prova 2" },
  { value: "final", label: "Final" },
  { value: "divulgacao", label: "Divulgação de resultados" },
];

type FaseFormProps = {
  olimpiadaId: string;
  proximaOrdem: number;
};

export function FaseForm({ olimpiadaId, proximaOrdem }: FaseFormProps) {
  const [state, formAction, isPending] = useActionState(criarFase, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="olimpiada_id" value={olimpiadaId} />
      <input type="hidden" name="ordem" value={proximaOrdem} />

      <div className="grid grid-cols-2 gap-4">
        <FormField id="fase_nome" label="Nome da fase" required>
          <input
            id="fase_nome"
            name="nome"
            type="text"
            placeholder="Ex.: 1ª Fase"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <FormField id="fase_tipo" label="Tipo" required>
          <select
            id="fase_tipo"
            name="tipo"
            defaultValue=""
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {TIPOS_FASE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="fase_inicio" label="Data de início" required>
          <input
            id="fase_inicio"
            name="data_inicio"
            type="date"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <FormField id="fase_fim" label="Data de fim" required>
          <input
            id="fase_fim"
            name="data_fim"
            type="date"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>
      </div>

      <FormField id="fase_observacoes" label="Observações">
        <input
          id="fase_observacoes"
          name="observacoes"
          type="text"
          placeholder="Opcional"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </FormField>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {isPending ? "Adicionando…" : "Adicionar fase"}
      </button>
    </form>
  );
}
