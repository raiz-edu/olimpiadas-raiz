"use client";

import { useState, useTransition } from "react";
import { sincronizarAlunosTOTVS, MARCAS_SYNC } from "./actions";
import type { SyncResult } from "./actions";

const TEAL = "rgb(91,184,193)";

export function SincronizacaoClient() {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<SyncResult | null>(null);

  function handleSync() {
    setResultado(null);
    startTransition(async () => {
      const r = await sincronizarAlunosTOTVS();
      setResultado(r);
    });
  }

  const isError = resultado && "error" in resultado;
  const isSuccess = resultado && "total" in resultado;

  return (
    <div className="space-y-5">
      {/* Escopo da sincronização */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Escopo da sincronização</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Alunos do 1º ano do Ensino Fundamental (Anos Iniciais) até a 3ª série do Ensino Médio,
            com matrícula ativa nas seguintes marcas:
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MARCAS_SYNC.map((m) => (
            <span
              key={m.slug}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: TEAL }}
            >
              {m.nome}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Fonte: TOTVS Mirror via raiz-data-engine · Alunos sem e-mail cadastrado são ignorados
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Como funciona</h2>
        <ol className="space-y-1.5 text-sm text-muted-foreground">
          {[
            "Consulta o TOTVS Mirror (Neon) via raiz-data-engine filtrando pelas 6 marcas e séries elegíveis.",
            "Cria conta de acesso (e-mail + senha) para alunos novos.",
            "Envia link de criação de senha para o e-mail do aluno.",
            "Alunos já cadastrados têm nome, série e marca atualizados — sem novo e-mail.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold text-white"
                style={{ background: TEAL }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Botão */}
      <button
        onClick={handleSync}
        disabled={isPending}
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: TEAL }}
      >
        {isPending ? "Sincronizando…" : "Iniciar sincronização"}
      </button>

      {/* Progresso */}
      {isPending && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          Importando alunos — isso pode levar alguns minutos…
        </div>
      )}

      {/* Resultado */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">Erro na sincronização</p>
          <p className="mt-1 text-sm text-destructive/80">
            {(resultado as { error: string }).error}
          </p>
        </div>
      )}

      {isSuccess &&
        (() => {
          const r = resultado as Exclude<SyncResult, { error: string }>;
          return (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Resultado da sincronização</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Processados", value: r.total, color: "text-foreground" },
                  { label: "Novos", value: r.novos, color: "text-emerald-400" },
                  { label: "Atualizados", value: r.atualizados, color: "text-blue-400" },
                  { label: "Sem e-mail", value: r.sem_email, color: "text-yellow-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {r.erros.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-yellow-400">
                    {r.erros.length} {r.erros.length === 1 ? "erro" : "erros"} encontrado
                    {r.erros.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="space-y-1">
                    {r.erros.slice(0, 20).map((e, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        · {e}
                      </li>
                    ))}
                    {r.erros.length > 20 && (
                      <li className="text-xs text-muted-foreground">
                        … e mais {r.erros.length - 20} erros.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
