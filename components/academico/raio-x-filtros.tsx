"use client";

import { useState } from "react";
import Link from "next/link";
import { selectClass } from "@/components/ui/form-field";
import {
  OLIMPIADA_LABEL,
  NIVEL_LABEL,
  NIVEIS_POR_OLIMPIADA,
  FASES_POR_OLIMPIADA,
  FASES_TODAS,
} from "@/lib/questoes/olimpiadas";

type Sp = {
  olimpiada?: string;
  nivel?: string;
  fase?: string;
  ano?: string;
  status_cadastro?: string;
};

/**
 * Barra de filtros do Raio-X — reativa: ao trocar a Origem, as opções de
 * Nível/Categoria e Fase se ajustam à olimpíada na hora (e resetam se ficarem
 * inválidas), sem precisar submeter. Continua um <form method="GET"> — a filtragem
 * só acontece ao clicar em Filtrar (e funciona sem JS como fallback).
 */
export function RaioXFiltros({
  sp,
  olimpiadas,
  niveisTodos,
  anos,
  recorteLabel,
  basePath,
}: {
  sp: Sp;
  olimpiadas: string[];
  niveisTodos: string[];
  anos: number[];
  recorteLabel: string;
  basePath: string;
}) {
  const [olimpiada, setOlimpiada] = useState(sp.olimpiada ?? "");
  const [nivel, setNivel] = useState(sp.nivel ?? "");
  const [fase, setFase] = useState(sp.fase ?? "");

  const niveisOpts = olimpiada ? (NIVEIS_POR_OLIMPIADA[olimpiada] ?? niveisTodos) : niveisTodos;
  const faseOpts = FASES_POR_OLIMPIADA[olimpiada] ?? FASES_TODAS;

  function onOlimpiada(v: string) {
    setOlimpiada(v);
    const nivs = v ? (NIVEIS_POR_OLIMPIADA[v] ?? niveisTodos) : niveisTodos;
    if (nivel && !nivs.includes(nivel)) setNivel("");
    const fases = FASES_POR_OLIMPIADA[v] ?? FASES_TODAS;
    if (fase && !fases.some((f) => f.value === fase)) setFase("");
  }

  return (
    <form method="GET" className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Origem</label>
          <select
            name="olimpiada"
            value={olimpiada}
            onChange={(e) => onOlimpiada(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {olimpiadas.map((o) => (
              <option key={o} value={o}>
                {OLIMPIADA_LABEL[o] ?? o}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Nível/Categoria</label>
          <select
            name="nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {niveisOpts.map((n) => (
              <option key={n} value={n}>
                {NIVEL_LABEL[n] ?? n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Fase</label>
          <select
            name="fase"
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {faseOpts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Ano</label>
          <select name="ano" defaultValue={sp.ano ?? ""} className={selectClass}>
            <option value="">Todos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status de revisão</label>
          <select
            name="status_cadastro"
            defaultValue={sp.status_cadastro ?? ""}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="publicado">Publicado</option>
            <option value="aguardando_revisao">Aguardando revisão</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Filtrar
          </button>
          <Link
            href={basePath}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
          >
            Limpar
          </Link>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Recorte: <span className="font-semibold text-foreground">{recorteLabel}</span>
      </p>
    </form>
  );
}
