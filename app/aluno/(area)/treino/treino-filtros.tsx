"use client";

import { useState } from "react";
import Link from "next/link";

const cls = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

interface TreinoFiltrosProps {
  olimpiadas: string[];
  topicosMap: Record<string, string[]>;
  subtopicosMap: Record<string, string[]>;
  defaults: {
    olimpiada?: string;
    nivel?: string;
    fase?: string;
    ano?: string;
    topico?: string;
    subtopico?: string;
    modo?: string;
  };
}

export function TreinoFiltros({
  olimpiadas,
  topicosMap,
  subtopicosMap,
  defaults,
}: TreinoFiltrosProps) {
  const [olimpiadaSel, setOlimpiadaSel] = useState(defaults.olimpiada ?? "");
  const [topicoSel, setTopicoSel] = useState(defaults.topico ?? "");
  const [subtopico, setSubtopico] = useState(defaults.subtopico ?? "");

  const topicos = olimpiadaSel ? (topicosMap[olimpiadaSel] ?? []) : (topicosMap[""] ?? []);
  const subtopicos = topicoSel ? (subtopicosMap[topicoSel] ?? []) : [];

  function handleOlimpiadaChange(val: string) {
    setOlimpiadaSel(val);
    setTopicoSel("");
    setSubtopico("");
  }

  function handleTopicoChange(val: string) {
    setTopicoSel(val);
    setSubtopico("");
  }

  return (
    <form
      method="GET"
      className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Origem
        </span>
        <select
          name="olimpiada"
          value={olimpiadaSel}
          onChange={(e) => handleOlimpiadaChange(e.target.value)}
          className={`${cls} min-w-[120px]`}
        >
          <option value="">Todas</option>
          {olimpiadas.map((o) => (
            <option key={o} value={o}>
              {o.toUpperCase().replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tópico
        </span>
        <select
          name="topico"
          value={topicoSel}
          onChange={(e) => handleTopicoChange(e.target.value)}
          className={`${cls} min-w-[140px]`}
        >
          <option value="">Todos</option>
          {topicos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {topicoSel && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subtópico
          </span>
          <select
            name="subtopico"
            value={subtopico}
            onChange={(e) => setSubtopico(e.target.value)}
            className={`${cls} min-w-[160px]`}
          >
            <option value="">Todos</option>
            {subtopicos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nível
        </span>
        <select name="nivel" defaultValue={defaults.nivel ?? ""} className={cls}>
          <option value="">Todos</option>
          <option value="nivel_1">Nível 1</option>
          <option value="nivel_2">Nível 2</option>
          <option value="nivel_3">Nível 3</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fase
        </span>
        <select name="fase" defaultValue={defaults.fase ?? ""} className={cls}>
          <option value="">Todas</option>
          <option value="1">1ª Fase</option>
          <option value="2">2ª Fase</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ano
        </span>
        <select name="ano" defaultValue={defaults.ano ?? ""} className={cls}>
          <option value="">Todos</option>
          {Array.from({ length: 11 }, (_, i) => 2015 + i).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo
        </span>
        <select name="modo" defaultValue={defaults.modo ?? "sequencial"} className={cls}>
          <option value="sequencial">Sequencial</option>
          <option value="aleatorio">Aleatório</option>
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Filtrar
        </button>
        <Link
          href="/aluno/treino"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
