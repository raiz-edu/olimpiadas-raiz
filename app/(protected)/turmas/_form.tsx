"use client";

import { useActionState } from "react";
import { criarTurma, atualizarTurma } from "./actions";
import { FormField } from "@/components/ui/form-field";

type Unidade = { id: string; nome: string; marca_nome?: string | null };

type TurmaFormProps = {
  unidades: Unidade[];
  turma?: {
    id: string;
    nome: string;
    unidade_id: string;
    serie: string;
    ano_letivo: number;
    ativo: boolean;
  };
};

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - 1 + i);

export function TurmaForm({ unidades, turma }: TurmaFormProps) {
  const isEdit = Boolean(turma);
  const action = isEdit ? atualizarTurma : criarTurma;

  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {isEdit && <input type="hidden" name="id" value={turma!.id} />}

      <FormField id="unidade_id" label="Unidade" required>
        <select
          id="unidade_id"
          name="unidade_id"
          defaultValue={turma?.unidade_id ?? ""}
          disabled={isEdit}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-background disabled:text-muted-foreground"
        >
          <option value="" disabled>
            Selecione uma unidade…
          </option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.marca_nome ? `${u.marca_nome} — ${u.nome}` : u.nome}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="nome" label="Nome da turma" required>
        <input
          id="nome"
          name="nome"
          type="text"
          defaultValue={turma?.nome ?? ""}
          placeholder="Ex.: 9º Ano A"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="ano_letivo" label="Ano letivo" required>
          <select
            id="ano_letivo"
            name="ano_letivo"
            defaultValue={turma?.ano_letivo ?? ANO_ATUAL}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="serie" label="Série / Nível" required>
          <input
            id="serie"
            name="serie"
            type="text"
            defaultValue={turma?.serie ?? ""}
            placeholder="Ex.: 9º Ano"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>
      </div>

      {isEdit && (
        <FormField id="ativo" label="Status">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              defaultChecked={turma?.ativo ?? true}
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-blue-500"
            />
            <span className="text-sm text-foreground">Turma ativa</span>
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
          {isPending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar turma"}
        </button>
        <a
          href="/turmas"
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
