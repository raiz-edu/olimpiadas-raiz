"use client";

import { useState, useTransition } from "react";
import { sincronizarAlunosTOTVS } from "./actions";
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
      {/* Card de instrução */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Como funciona</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold text-white"
              style={{ background: TEAL }}
            >
              1
            </span>
            Busca os alunos cadastrados no TOTVS RM via raiz-data-engine.
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold text-white"
              style={{ background: TEAL }}
            >
              2
            </span>
            Cria conta de acesso para alunos novos (e-mail como login).
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold text-white"
              style={{ background: TEAL }}
            >
              3
            </span>
            Envia e-mail de boas-vindas com link para criação de senha.
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold text-white"
              style={{ background: TEAL }}
            >
              4
            </span>
            Alunos já cadastrados têm seus dados atualizados sem novo e-mail.
          </li>
        </ul>
      </div>

      {/* Botão */}
      <button
        onClick={handleSync}
        disabled={isPending}
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: TEAL }}
      >
        {isPending ? "Sincronizando…" : "Sincronizar alunos do TOTVS"}
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
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total processados", value: r.total, color: "text-foreground" },
                  { label: "Novos alunos", value: r.novos, color: "text-emerald-400" },
                  { label: "Atualizados", value: r.atualizados, color: "text-blue-400" },
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
                    {r.erros.length} {r.erros.length === 1 ? "erro" : "erros"} encontrados:
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
