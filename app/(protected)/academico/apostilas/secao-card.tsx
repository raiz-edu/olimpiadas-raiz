"use client";

import { TAXONOMIA_QUESTOES } from "@/lib/questoes/taxonomia";
import { inputClass } from "@/components/ui/form-field";
import type { MixDificuldade, SecaoReceita } from "@/lib/apostilas/receita";
import { DIFICULDADES_MIX, DIFICULDADE_LABEL, somaMix } from "@/lib/apostilas/receita";

export function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        ativo
          ? "border-primary bg-primary/10 text-primary"
          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

export function MixEditor({
  mix,
  onChange,
}: {
  mix: MixDificuldade | undefined;
  onChange: (mix: MixDificuldade | undefined) => void;
}) {
  const soma = somaMix(mix);
  return (
    <div className="flex flex-wrap items-end gap-3">
      {DIFICULDADES_MIX.map((d) => (
        <label key={d} className="flex flex-col gap-1 text-xs text-gray-600">
          {DIFICULDADE_LABEL[d]} (%)
          <input
            type="number"
            min={0}
            max={100}
            value={mix?.[d] ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : Number(e.target.value);
              const novo = { ...(mix ?? {}) };
              if (v === undefined) delete novo[d];
              else novo[d] = v;
              onChange(Object.keys(novo).length ? novo : undefined);
            }}
            className={`${inputClass} w-24`}
          />
        </label>
      ))}
      {mix && (
        <span
          className={`pb-2 text-xs font-semibold ${soma === 100 ? "text-emerald-600" : "text-red-600"}`}
        >
          soma: {soma}%
        </span>
      )}
    </div>
  );
}

/**
 * Card de uma seção do construtor: marcar o tópico o inclui na apostila;
 * aberto, permite quantidade, subtópicos e mix próprio.
 */
export function SecaoCard({
  topico,
  value,
  onChange,
}: {
  topico: string;
  value: SecaoReceita | null;
  onChange: (sec: SecaoReceita | null) => void;
}) {
  const subs = TAXONOMIA_QUESTOES[topico] ?? [];
  const ativa = value !== null;
  return (
    <div
      className={`rounded-xl border p-4 ${ativa ? "border-primary/40 bg-primary/[0.03]" : "border-gray-200"}`}
    >
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={ativa}
          onChange={(e) => onChange(e.target.checked ? { topico } : null)}
        />
        <span className="text-sm font-semibold">{topico}</span>
      </label>

      {ativa && (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Quantidade de questões
            <input
              type="number"
              min={1}
              value={value.quantidade ?? ""}
              placeholder="todas"
              onChange={(e) =>
                onChange({
                  ...value,
                  quantidade: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className={`${inputClass} w-28`}
            />
            <span className="text-gray-400">(vazio = todas que casarem)</span>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {subs.map((sub) => {
              const marcado = value.subtopicos?.includes(sub) ?? false;
              return (
                <Chip
                  key={sub}
                  ativo={marcado}
                  onClick={() => {
                    const atual = new Set(value.subtopicos ?? []);
                    if (marcado) atual.delete(sub);
                    else atual.add(sub);
                    const lista = [...atual];
                    onChange({ ...value, subtopicos: lista.length ? lista : undefined });
                  }}
                >
                  {sub}
                </Chip>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400">Nenhum subtópico marcado = o tópico inteiro.</p>

          <details open={!!value.mix_dificuldade}>
            <summary className="cursor-pointer text-xs font-medium text-gray-600">
              Mix de dificuldade próprio desta seção (opcional)
            </summary>
            <div className="mt-2">
              <MixEditor
                mix={value.mix_dificuldade}
                onChange={(mix) => onChange({ ...value, mix_dificuldade: mix })}
              />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
