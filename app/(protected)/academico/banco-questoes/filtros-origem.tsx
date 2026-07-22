"use client";

import { useState } from "react";
import {
  NIVEL_LABEL,
  NIVEIS_POR_OLIMPIADA,
  NIVEIS_TODOS,
  FASES_POR_OLIMPIADA,
  FASES_TODAS,
} from "@/lib/questoes/olimpiadas";

const OLIMPIADAS: { value: string; label: string }[] = [
  { value: "obmep", label: "OBMEP" },
  { value: "obmep_mirim", label: "OBMEP Mirim" },
  { value: "canguru", label: "Canguru" },
  { value: "obm", label: "OBM" },
  { value: "obf", label: "OBF" },
  { value: "obi", label: "OBI" },
];

/**
 * Selects acoplados Origem → Nível → Fase. Ao trocar a origem, as opções de nível
 * e fase se reajustam na hora (Canguru mostra P/E/B/C/J/S + "Fase Única"; OBMEP mostra
 * Nível 1/2/3 + 1ª/2ª). Um nível/fase selecionado que não pertence à nova origem é
 * resetado. Mantém os `name` para o form GET continuar submetendo os filtros.
 */
export function FiltrosOrigem({
  olimpiada: olimpiadaInicial,
  nivel: nivelInicial,
  fase: faseInicial,
  className,
}: {
  olimpiada: string;
  nivel: string;
  fase: string;
  className: string;
}) {
  const [olimpiada, setOlimpiada] = useState(olimpiadaInicial);
  const [nivel, setNivel] = useState(nivelInicial);
  const [fase, setFase] = useState(faseInicial);

  const niveis = NIVEIS_POR_OLIMPIADA[olimpiada] ?? NIVEIS_TODOS;
  const fases = FASES_POR_OLIMPIADA[olimpiada] ?? FASES_TODAS;

  function trocarOlimpiada(nova: string) {
    setOlimpiada(nova);
    const niveisNovos = NIVEIS_POR_OLIMPIADA[nova] ?? NIVEIS_TODOS;
    if (nivel && !niveisNovos.includes(nivel)) setNivel("");
    const fasesNovas = FASES_POR_OLIMPIADA[nova] ?? FASES_TODAS;
    if (fase && !fasesNovas.some((f) => f.value === fase)) setFase("");
  }

  return (
    <>
      <select
        name="olimpiada"
        value={olimpiada}
        onChange={(e) => trocarOlimpiada(e.target.value)}
        className={className}
      >
        <option value="">Origem</option>
        {OLIMPIADAS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        name="nivel"
        value={nivel}
        onChange={(e) => setNivel(e.target.value)}
        className={className}
      >
        <option value="">Nível</option>
        {niveis.map((n) => (
          <option key={n} value={n}>
            {NIVEL_LABEL[n] ?? n}
          </option>
        ))}
      </select>

      <select
        name="fase"
        value={fase}
        onChange={(e) => setFase(e.target.value)}
        className={className}
      >
        <option value="">Fase</option>
        {fases.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
    </>
  );
}
