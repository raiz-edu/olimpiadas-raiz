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
  // Tópico efetivo: o salvo ou — se vier vazio — derivado do subtópico (a taxonomia é 1:1).
  // Espelha a blindagem do server action e garante o pré-preenchimento.
  const topicoEfetivo = (defaultTopico ?? "").trim() || (topicoDeSubtopico(defaultSubtopico) ?? "");

  // Estado APENAS para filtrar os subtópicos conforme o tópico escolhido. NÃO controla o
  // `value` do select de tópico: ele é NÃO-CONTROLADO (defaultValue), como os selects de
  // Dificuldade/Público. Isso é essencial porque o React 19 RESETA o form automaticamente
  // após um Server Action — um select *controlado* voltava para o 1º item ("Não definido")
  // e "perdia" o tópico na tela; `defaultValue` sobrevive ao reset (volta ao valor salvo).
  const [topicoSel, setTopicoSel] = useState(topicoEfetivo);
  // Re-sincroniza com o dado salvo quando ele muda (revalidate após salvar), preservando a
  // troca manual do usuário — mantém as opções de subtópico coerentes com o tópico atual.
  const [topicoBase, setTopicoBase] = useState(topicoEfetivo);
  if (topicoEfetivo !== topicoBase) {
    setTopicoBase(topicoEfetivo);
    setTopicoSel(topicoEfetivo);
  }
  const subtopicos = TAXONOMIA_QUESTOES[topicoSel] ?? [];
  const subtopicoInicial = defaultSubtopico ?? "";
  const topicoForaDaLista = topicoEfetivo !== "" && !TOPICOS_QUESTOES.includes(topicoEfetivo);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Tópico</label>
        <select
          name="topico"
          defaultValue={topicoEfetivo}
          onChange={(e) => setTopicoSel(e.target.value)}
          className={selectClass}
        >
          <option value="">Não definido</option>
          {TOPICOS_QUESTOES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {topicoForaDaLista && <option value={topicoEfetivo}>{topicoEfetivo} (legado)</option>}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Subtópico</label>
        <select
          name="subtopico"
          key={topicoSel}
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
