"use client";

import { useActionState } from "react";
import { criarUnidade, atualizarUnidade } from "./actions";
import { FormField } from "@/components/ui/form-field";

type Marca = { id: string; nome: string };

type UnidadeFormProps = {
  marcas: Marca[];
  unidade?: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    ativo: boolean;
    marca_id: string;
  };
};

const ESTADOS_BR = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export function UnidadeForm({ marcas, unidade }: UnidadeFormProps) {
  const isEdit = Boolean(unidade);
  const action = isEdit ? atualizarUnidade : criarUnidade;

  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {isEdit && <input type="hidden" name="id" value={unidade!.id} />}

      <FormField id="marca_id" label="Marca" required>
        <select
          id="marca_id"
          name="marca_id"
          defaultValue={unidade?.marca_id ?? ""}
          disabled={isEdit}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="" disabled>
            Selecione uma marca…
          </option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="nome" label="Nome da unidade" required>
        <input
          id="nome"
          name="nome"
          type="text"
          defaultValue={unidade?.nome ?? ""}
          placeholder="Ex.: Colégio Qi — Recreio"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="cidade" label="Cidade">
          <input
            id="cidade"
            name="cidade"
            type="text"
            defaultValue={unidade?.cidade ?? ""}
            placeholder="Ex.: Rio de Janeiro"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <FormField id="estado" label="Estado">
          <select
            id="estado"
            name="estado"
            defaultValue={unidade?.estado ?? ""}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— UF —</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {isEdit && (
        <FormField id="ativo" label="Status">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              defaultChecked={unidade?.ativo ?? true}
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Unidade ativa</span>
          </label>
        </FormField>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar unidade"}
        </button>
        <a
          href="/unidades"
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
