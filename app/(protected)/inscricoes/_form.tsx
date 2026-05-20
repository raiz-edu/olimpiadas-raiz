"use client";

import { useActionState, useState } from "react";
import { inscreverAluno } from "./actions";
import { FormField } from "@/components/ui/form-field";

type Olimpiada = {
  id: string;
  nome: string;
  ano_letivo: number;
  limite_vagas_total: number | null;
  series_elegiveis: string[];
};

type Aluno = {
  id: string;
  nome: string;
  turma_nome: string | null;
  serie: string | null;
  unidade_nome: string | null;
};

type InscricaoFormProps = {
  olimpiadas: Olimpiada[];
  alunos: Aluno[];
};

export function InscricaoForm({ olimpiadas, alunos }: InscricaoFormProps) {
  const [state, formAction, isPending] = useActionState(inscreverAluno, null);
  const [olimpiadaId, setOlimpiadaId] = useState("");

  const olimpiadaSelecionada = olimpiadas.find((o) => o.id === olimpiadaId);

  // Filtra alunos cujas séries são elegíveis para a olimpíada selecionada
  const alunosFiltrados = olimpiadaSelecionada?.series_elegiveis?.length
    ? alunos.filter((a) => !a.serie || olimpiadaSelecionada.series_elegiveis.includes(a.serie))
    : alunos;

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <FormField id="olimpiada_id" label="Olimpíada" required>
        <select
          id="olimpiada_id"
          name="olimpiada_id"
          value={olimpiadaId}
          onChange={(e) => setOlimpiadaId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>
            Selecione uma olimpíada…
          </option>
          {olimpiadas.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} ({o.ano_letivo})
              {o.limite_vagas_total ? ` — máx. ${o.limite_vagas_total} vagas` : ""}
            </option>
          ))}
        </select>
      </FormField>

      {olimpiadaSelecionada && olimpiadaSelecionada.series_elegiveis.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          Séries elegíveis: {olimpiadaSelecionada.series_elegiveis.join(", ")}
        </p>
      )}

      <FormField id="aluno_id" label="Aluno" required>
        <select
          id="aluno_id"
          name="aluno_id"
          defaultValue=""
          disabled={!olimpiadaId}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-background disabled:text-muted-foreground"
        >
          <option value="" disabled>
            {olimpiadaId ? "Selecione um aluno…" : "Selecione a olimpíada primeiro"}
          </option>
          {alunosFiltrados.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
              {a.unidade_nome ? ` — ${a.unidade_nome}` : ""}
              {a.turma_nome ? ` / ${a.turma_nome}` : ""}
            </option>
          ))}
        </select>
      </FormField>

      {olimpiadaId && alunosFiltrados.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Nenhum aluno elegível encontrado para as séries desta olimpíada.
        </p>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || !olimpiadaId}
          className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? "Inscrevendo…" : "Inscrever aluno"}
        </button>
        <a
          href="/inscricoes"
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
