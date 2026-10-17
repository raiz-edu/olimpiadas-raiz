"use client";

import { useState } from "react";
import {
  SEM_FASE,
  SEM_NIVEL,
  type OrigemRecorte,
  type RecorteQuestoes,
} from "@/lib/engajamento/recortes";

export function FiltrosQuestoes({
  catalogo,
  filtros,
  className,
  obrigatorio = false,
}: {
  catalogo: OrigemRecorte[];
  filtros: RecorteQuestoes;
  className: string;
  obrigatorio?: boolean;
}) {
  const [olimpiada, setOlimpiada] = useState(filtros.olimpiada ?? "");
  const [nivel, setNivel] = useState(filtros.nivel ?? "");
  const [fase, setFase] = useState(filtros.fase ?? "");
  const origem = catalogo.find((o) => o.valor === olimpiada);
  const niveis = (origem?.niveis ?? []).filter((n) => !obrigatorio || n.valor !== SEM_NIVEL);
  const fases = (origem?.fases ?? []).filter((f) => !obrigatorio || f.valor !== SEM_FASE);
  const campos = [
    {
      nome: "olimpiada",
      rotulo: "Olimpíada",
      valor: olimpiada,
      padrao: obrigatorio ? "Selecione uma olimpíada" : "Todas as olimpíadas",
      opcoes: catalogo,
      mudar: (valor: string) => {
        setOlimpiada(valor);
        setNivel("");
        const novas =
          catalogo.find((o) => o.valor === valor)?.fases.filter((f) => f.valor !== SEM_FASE) ?? [];
        setFase(novas.length === 1 ? novas[0]!.valor : "");
      },
    },
    {
      nome: "nivel",
      rotulo: "Nível",
      valor: nivel,
      padrao: obrigatorio ? "Selecione um nível" : "Todos os níveis",
      opcoes: niveis,
      mudar: setNivel,
    },
    {
      nome: "fase",
      rotulo: olimpiada === "mandacaru" ? "Modalidade" : "Fase",
      valor: fase,
      padrao: obrigatorio ? "Selecione uma fase" : "Todas as fases",
      opcoes: fases,
      mudar: setFase,
    },
  ];
  return (
    <>
      {campos.map((campo) => (
        <label
          key={campo.nome}
          className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground"
        >
          {campo.rotulo}
          <select
            name={campo.nome}
            aria-label={campo.rotulo}
            className={className}
            value={campo.valor}
            required={obrigatorio}
            disabled={campo.nome !== "olimpiada" && !olimpiada}
            onChange={(evento) => campo.mudar(evento.target.value)}
          >
            <option value="">{campo.padrao}</option>
            {campo.valor && !campo.opcoes.some((o) => o.valor === campo.valor) && (
              <option value={campo.valor}>Seleção indisponível</option>
            )}
            {campo.opcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.nome}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );
}
