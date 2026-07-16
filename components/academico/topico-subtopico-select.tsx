"use client";

import { useState } from "react";
import { selectClass } from "@/components/ui/form-field";
import { TAXONOMIA_QUESTOES, TOPICOS_QUESTOES } from "@/lib/questoes/taxonomia";

/**
 * Par de selects dependentes (tópico → subtópico) preso à taxonomia canônica.
 * Substitui os inputs de texto livre que causavam deriva na classificação.
 */
export function TopicoSubtopicoSelect({
  defaultTopico,
  defaultSubtopico,
  labelClass = "block text-sm font-medium text-foreground",
}: {
  defaultTopico?: string | null;
  defaultSubtopico?: string | null;
  labelClass?: string;
}) {
  // Valor legado fora da taxonomia: preserva como opção extra até ser trocado
  const topicoInicial = defaultTopico ?? "";
  const [topico, setTopico] = useState(topicoInicial);
  const subtopicos = TAXONOMIA_QUESTOES[topico] ?? [];
  const subtopicoInicial = defaultSubtopico ?? "";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Tópico</label>
        <select
          name="topico"
          value={topico}
          onChange={(e) => setTopico(e.target.value)}
          className={selectClass}
        >
          <option value="">Não definido</option>
          {TOPICOS_QUESTOES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {topicoInicial && !TOPICOS_QUESTOES.includes(topicoInicial) && (
            <option value={topicoInicial}>{topicoInicial} (legado)</option>
          )}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Subtópico</label>
        <select
          name="subtopico"
          key={topico}
          defaultValue={subtopicos.includes(subtopicoInicial) ? subtopicoInicial : ""}
          className={selectClass}
          disabled={subtopicos.length === 0 && !subtopicoInicial}
        >
          <option value="">Não definido</option>
          {subtopicos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {subtopicoInicial && !subtopicos.includes(subtopicoInicial) && (
            <option value={subtopicoInicial}>{subtopicoInicial} (legado)</option>
          )}
        </select>
      </div>
    </div>
  );
}
