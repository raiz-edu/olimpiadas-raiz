"use client";

import { useActionState } from "react";
import { criarOlimpiada, atualizarOlimpiada } from "./actions";
import { FormField } from "@/components/ui/form-field";

const AREAS = [
  "Matemática",
  "Ciências / Biologia",
  "Química",
  "Física",
  "Língua Portuguesa",
  "Língua Inglesa",
  "Língua Espanhola",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Artes",
  "Informática",
  "Astronomia",
  "Interdisciplinar",
  "Outro",
];

const SERIES = [
  "1º Ano EF",
  "2º Ano EF",
  "3º Ano EF",
  "4º Ano EF",
  "5º Ano EF",
  "6º Ano EF",
  "7º Ano EF",
  "8º Ano EF",
  "9º Ano EF",
  "1ª Série EM",
  "2ª Série EM",
  "3ª Série EM",
];

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - 1 + i);

type OlimpiadaFormProps = {
  olimpiada?: {
    id: string;
    nome: string;
    area_conhecimento: string;
    classificacao: "obrigatoria" | "facultativa";
    ano_letivo: number;
    organizacao_promotora: string | null;
    premiacao: string | null;
    regulamento_link_externo: string | null;
    faixa_etaria_min: number | null;
    faixa_etaria_max: number | null;
    limite_vagas_total: number | null;
    series_elegiveis: string[];
    ativo: boolean;
  };
};

export function OlimpiadaForm({ olimpiada }: OlimpiadaFormProps) {
  const isEdit = Boolean(olimpiada);
  const action = isEdit ? atualizarOlimpiada : criarOlimpiada;

  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {isEdit && <input type="hidden" name="id" value={olimpiada!.id} />}

      {/* Informações básicas */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Informações básicas
        </h3>

        <FormField id="nome" label="Nome da olimpíada" required>
          <input
            id="nome"
            name="nome"
            type="text"
            defaultValue={olimpiada?.nome ?? ""}
            placeholder="Ex.: Olimpíada Brasileira de Matemática"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="area_conhecimento" label="Área do conhecimento" required>
            <select
              id="area_conhecimento"
              name="area_conhecimento"
              defaultValue={olimpiada?.area_conhecimento ?? ""}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="classificacao" label="Classificação" required>
            <select
              id="classificacao"
              name="classificacao"
              defaultValue={olimpiada?.classificacao ?? ""}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                Selecione…
              </option>
              <option value="obrigatoria">Obrigatória</option>
              <option value="facultativa">Facultativa</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="ano_letivo" label="Ano letivo" required>
            <select
              id="ano_letivo"
              name="ano_letivo"
              defaultValue={olimpiada?.ano_letivo ?? ANO_ATUAL}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ANOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="organizacao_promotora" label="Organização promotora">
            <input
              id="organizacao_promotora"
              name="organizacao_promotora"
              type="text"
              defaultValue={olimpiada?.organizacao_promotora ?? ""}
              placeholder="Ex.: IMPA, OBMEP"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>
        </div>
      </div>

      {/* Séries elegíveis */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Séries elegíveis
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SERIES.map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="series_elegiveis"
                value={s}
                defaultChecked={olimpiada?.series_elegiveis?.includes(s) ?? false}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Detalhes adicionais */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Detalhes adicionais
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="faixa_etaria_min" label="Idade mínima">
            <input
              id="faixa_etaria_min"
              name="faixa_etaria_min"
              type="number"
              min={0}
              max={99}
              defaultValue={olimpiada?.faixa_etaria_min ?? ""}
              placeholder="Ex.: 10"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>

          <FormField id="faixa_etaria_max" label="Idade máxima">
            <input
              id="faixa_etaria_max"
              name="faixa_etaria_max"
              type="number"
              min={0}
              max={99}
              defaultValue={olimpiada?.faixa_etaria_max ?? ""}
              placeholder="Ex.: 18"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="limite_vagas_total" label="Limite de vagas">
            <input
              id="limite_vagas_total"
              name="limite_vagas_total"
              type="number"
              min={1}
              defaultValue={olimpiada?.limite_vagas_total ?? ""}
              placeholder="Sem limite se vazio"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>

          <FormField id="regulamento_link_externo" label="Link do regulamento">
            <input
              id="regulamento_link_externo"
              name="regulamento_link_externo"
              type="url"
              defaultValue={olimpiada?.regulamento_link_externo ?? ""}
              placeholder="https://…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <FormField id="premiacao" label="Premiação">
          <input
            id="premiacao"
            name="premiacao"
            type="text"
            defaultValue={olimpiada?.premiacao ?? ""}
            placeholder="Ex.: Medalhas, certificados, bolsas"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              defaultChecked={olimpiada?.ativo ?? true}
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Olimpíada ativa</span>
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
          {isPending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar olimpíada"}
        </button>
        <a
          href={isEdit ? `/olimpiadas/${olimpiada!.id}` : "/olimpiadas"}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
