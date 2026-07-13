"use client";

import { useState } from "react";
import Link from "next/link";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { toSaoPauloDatetimeLocal } from "@/lib/time/sao-paulo";

const SERIES_SEGMENTOS = [
  { label: "EFAI — 1º ao 5º ano", series: ["1º", "2º", "3º", "4º", "5º"] },
  { label: "EFAF — 6º ao 9º ano", series: ["6º", "7º", "8º", "9º"] },
  { label: "Ensino Médio", series: ["1º EM", "2º EM", "3º EM"] },
];

type Projeto = { id: string; nome: string; olimpiada_sigla: string; ano_letivo: number };
type Turma = {
  id: string;
  nome: string;
  serie: string;
  ano_letivo: number;
  unidade_nome?: string;
};

type SimuladoFormProps = {
  action: (formData: FormData) => void;
  projetos: Projeto[];
  turmas?: Turma[];
  defaults?: {
    titulo?: string;
    modalidade?: string;
    data_hora?: string;
    duracao?: string;
    link?: string;
    polos?: string;
    descricao?: string;
    publicada?: boolean;
    projeto_ids?: string[];
    turma_ids?: string[];
    series_elegiveis?: string[];
  };
  submitLabel?: string;
  cancelHref?: string;
  error?: string | null;
  /** Só o raiz controla a publicação; gestor cria/edita em rascunho (aguardando aprovação) */
  isRaiz?: boolean;
};

export function SimuladoForm({
  action,
  projetos,
  turmas = [],
  defaults = {},
  submitLabel = "Salvar",
  cancelHref = "/academico/simulados",
  error,
  isRaiz = false,
}: SimuladoFormProps) {
  const [modalidade, setModalidade] = useState<"online" | "presencial">(
    (defaults.modalidade as "online" | "presencial") ?? "online",
  );
  const [vinculo, setVinculo] = useState<"projetos" | "turmas" | "series">(
    (defaults.turma_ids?.length ?? 0) > 0
      ? "turmas"
      : (defaults.projeto_ids?.length ?? 0) > 0 || (defaults.series_elegiveis?.length ?? 0) === 0
        ? "projetos"
        : "series",
  );

  return (
    <form action={action} className="space-y-6 rounded-xl border border-border bg-card p-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Dados básicos */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dados do simulado
        </h2>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Título *</label>
          <input
            name="titulo"
            type="text"
            required
            defaultValue={defaults.titulo ?? ""}
            placeholder="Ex: Simulado OBMEP — Nível 2"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Modalidade</label>
            <div className="flex gap-4 mt-2">
              {(["online", "presencial"] as const).map((m) => (
                <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidade"
                    value={m}
                    checked={modalidade === m}
                    onChange={() => setModalidade(m)}
                    className="accent-primary"
                  />
                  <span className="text-sm capitalize text-foreground">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Status</label>
            {isRaiz ? (
              <select
                name="publicada"
                defaultValue={defaults.publicada ? "true" : "false"}
                className={selectClass}
              >
                <option value="false">Rascunho</option>
                <option value="true">Publicado</option>
              </select>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {defaults.publicada ? (
                  <span className="text-emerald-400">Publicado</span>
                ) : (
                  <span className="text-amber-400">Aguardando aprovação</span>
                )}
                <span className="block text-[11px]">A publicação é feita pela administração.</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Data e hora</label>
            <input
              name="data_hora"
              type="datetime-local"
              defaultValue={toSaoPauloDatetimeLocal(defaults.data_hora)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Duração (HH:MM:SS)</label>
            <input
              name="duracao"
              type="text"
              defaultValue={defaults.duracao ?? ""}
              placeholder="02:30:00"
              className={inputClass}
            />
          </div>
        </div>

        {modalidade === "online" ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Link do simulado</label>
            <input
              name="link"
              type="url"
              defaultValue={defaults.link ?? ""}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Polo(s)</label>
            <textarea
              name="polos"
              rows={2}
              defaultValue={defaults.polos ?? ""}
              placeholder="Ex: Centro Raiz SP — Rua X, nº 10"
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Descrição / instruções
          </label>
          <textarea
            name="descricao"
            rows={3}
            defaultValue={defaults.descricao ?? ""}
            placeholder="Conteúdo cobrado, materiais permitidos…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Vinculação */}
      <div className="space-y-4 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quem pode acessar
          </h2>
          <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
            {(["projetos", "turmas", "series"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVinculo(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  vinculo === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "projetos" ? "Por projeto" : v === "turmas" ? "Por turma" : "Por série"}
              </button>
            ))}
          </div>
        </div>

        {vinculo === "projetos" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Alunos dos projetos selecionados poderão acessar este simulado.
            </p>
            {projetos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto ativo cadastrado.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {projetos.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="projeto_ids[]"
                      value={p.id}
                      defaultChecked={defaults.projeto_ids?.includes(p.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {p.nome}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({p.olimpiada_sigla} {p.ano_letivo})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : vinculo === "turmas" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Alunos das turmas selecionadas poderão acessar este simulado.
            </p>
            {turmas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma ativa cadastrada.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {turmas.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="turma_ids[]"
                      value={t.id}
                      defaultChecked={defaults.turma_ids?.includes(t.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {t.nome}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({t.serie} {t.ano_letivo}
                        {t.unidade_nome ? ` · ${t.unidade_nome}` : ""})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Alunos das séries selecionadas poderão acessar este simulado.
            </p>
            {SERIES_SEGMENTOS.map(({ label, series }) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {series.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        name="series_elegiveis[]"
                        value={s}
                        defaultChecked={defaults.series_elegiveis?.includes(s)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-foreground">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3 border-t border-border pt-5">
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
