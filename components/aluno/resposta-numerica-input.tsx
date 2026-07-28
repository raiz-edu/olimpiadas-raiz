"use client";

import { useState } from "react";

const TEAL = "rgb(91,184,193)";

interface InputProps {
  questaoId: string;
  contexto: string;
  aulaId?: string;
  action: (payload: FormData) => void;
  isPending: boolean;
}

/**
 * Campo de resposta das questões numéricas (Jacob Palis: "Respostas numéricas").
 * O aluno informa um inteiro de 0000 a 9999 — sem alternativas, sem redação.
 * A correção é por igualdade de valor, então zeros à esquerda são opcionais.
 */
export function RespostaNumericaInput({
  questaoId,
  contexto,
  aulaId,
  action,
  isPending,
}: InputProps) {
  const [valor, setValor] = useState("");

  return (
    <form action={action} className="mb-5">
      <input type="hidden" name="questao_id" value={questaoId} />
      <input type="hidden" name="contexto" value={contexto} />
      {aulaId && <input type="hidden" name="aula_id" value={aulaId} />}
      <input type="hidden" name="resposta_numerica" value={valor} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={valor}
          // Só algarismos, no máximo 4 — bloqueia sinal, vírgula e espaço na origem
          onChange={(e) => setValor(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="0000"
          aria-label="Sua resposta: número inteiro de 0000 a 9999"
          className="w-32 rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-[rgb(91,184,193)]"
        />

        <button
          type="submit"
          disabled={isPending || valor.length === 0}
          className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: TEAL }}
        >
          {isPending ? "Conferindo…" : "Confirmar"}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground/60">
        Resposta é um número inteiro entre 0000 e 9999.
      </p>
    </form>
  );
}

/** Resultado da questão numérica: acerto/erro + o gabarito revelado. */
export function FeedbackNumerico({ correta, gabarito }: { correta: boolean; gabarito: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold mb-4 ${
        correta
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      }`}
    >
      {correta ? (
        "✓ Correto!"
      ) : (
        <>
          <span>✗ Resposta incorreta.</span>
          <span className="font-mono font-normal">Gabarito: {gabarito}</span>
        </>
      )}
    </div>
  );
}
