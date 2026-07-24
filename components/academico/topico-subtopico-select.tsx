"use client";

import { useState } from "react";
import { selectClass } from "@/components/ui/form-field";
import { TAXONOMIA_QUESTOES, TOPICOS_QUESTOES, topicoDeSubtopico } from "@/lib/questoes/taxonomia";

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
  // Tópico efetivo: o salvo ou — se vier vazio — derivado do subtópico (a taxonomia é
  // 1:1). Espelha a blindagem do server action (atualizarQuestao) e garante que o select
  // pré-selecione o valor certo mesmo quando só o subtópico chega preenchido.
  const topicoEfetivo = (defaultTopico ?? "").trim() || (topicoDeSubtopico(defaultSubtopico) ?? "");

  const [topico, setTopico] = useState(topicoEfetivo);
  // Re-sincroniza o estado quando os dados salvos mudam (ex.: revalidate após salvar),
  // evitando que o select fique preso num valor stale e "perca" o tópico na tela.
  const [topicoBase, setTopicoBase] = useState(topicoEfetivo);
  if (topicoEfetivo !== topicoBase) {
    setTopicoBase(topicoEfetivo);
    setTopico(topicoEfetivo);
  }

  const subtopicos = TAXONOMIA_QUESTOES[topico] ?? [];
  const subtopicoInicial = defaultSubtopico ?? "";
  // Valor atual fora da taxonomia (legado): sempre renderiza uma option para ele, senão o
  // select controlado não acha correspondência e cai no primeiro item ("Não definido").
  const topicoForaDaLista = topico !== "" && !TOPICOS_QUESTOES.includes(topico);

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
          {topicoForaDaLista && <option value={topico}>{topico} (legado)</option>}
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
