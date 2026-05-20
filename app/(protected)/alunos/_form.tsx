"use client";

import { useActionState } from "react";
import { criarAluno, atualizarAluno } from "./actions";
import { FormField } from "@/components/ui/form-field";

type Turma = { id: string; nome: string; unidade_nome?: string | null };

type AlunoFormProps = {
  turmas: Turma[];
  aluno?: {
    id: string;
    nome: string;
    turma_id: string;
    data_nascimento: string;
    cpf: string | null;
    ativo: boolean;
  };
};

export function AlunoForm({ turmas, aluno }: AlunoFormProps) {
  const isEdit = Boolean(aluno);
  const action = isEdit ? atualizarAluno : criarAluno;

  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {isEdit && <input type="hidden" name="id" value={aluno!.id} />}

      <FormField id="turma_id" label="Turma" required>
        <select
          id="turma_id"
          name="turma_id"
          defaultValue={aluno?.turma_id ?? ""}
          disabled={isEdit}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-background disabled:text-muted-foreground"
        >
          <option value="" disabled>
            Selecione uma turma…
          </option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.unidade_nome ? `${t.unidade_nome} — ${t.nome}` : t.nome}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="nome" label="Nome completo" required>
        <input
          id="nome"
          name="nome"
          type="text"
          defaultValue={aluno?.nome ?? ""}
          placeholder="Ex.: João da Silva"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="data_nascimento" label="Data de nascimento" required>
          <input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={aluno?.data_nascimento ?? ""}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <FormField id="cpf" label="CPF">
          <input
            id="cpf"
            name="cpf"
            type="text"
            defaultValue={aluno?.cpf ?? ""}
            placeholder="000.000.000-00"
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
              defaultChecked={aluno?.ativo ?? true}
              value="true"
              className="h-4 w-4 rounded border-border text-primary focus:ring-blue-500"
            />
            <span className="text-sm text-foreground">Aluno ativo</span>
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
          {isPending ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar aluno"}
        </button>
        <a
          href="/alunos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
