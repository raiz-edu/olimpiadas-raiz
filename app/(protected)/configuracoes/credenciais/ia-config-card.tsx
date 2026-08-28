"use client";

import { useActionState } from "react";
import { inputClass, selectClass } from "@/components/ui/form-field";
import type { ConfigIA } from "@/lib/ai/config";
import type { ProvedorIA } from "@/lib/ai/provedores";
import { salvarConfigIA, testarModelosIA, type ConfigIAState } from "./ia-actions";

type Props = {
  config: ConfigIA;
  provedores: Array<{ id: ProvedorIA; rotulo: string; comChave: boolean }>;
};

function Mensagem({ state }: { state: ConfigIAState }) {
  if (!state) return null;
  if ("error" in state) {
    return (
      <p className="whitespace-pre-line rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  return (
    <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
      <p>{state.message}</p>
      {state.linhas && (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 font-mono text-xs">
          {state.linhas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IaConfigCard({ config, provedores }: Props) {
  const [salvo, salvar, salvando] = useActionState<ConfigIAState, FormData>(salvarConfigIA, null);
  const [teste, testar, testando] = useActionState<ConfigIAState, FormData>(testarModelosIA, null);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">Avaliação por IA</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Quem avalia as questões discursivas e lê as fotos dos alunos. Se o primário falhar (chave
          ausente, erro ou fora do ar), o fallback assume na hora. Vale sem novo deploy.
        </p>
      </div>

      <form action={salvar} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ia_provedor"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Provedor primário
            </label>
            <select
              id="ia_provedor"
              name="ia_provedor"
              defaultValue={config.provedor}
              className={selectClass}
            >
              {provedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rotulo}
                  {p.comChave ? "" : " (sem chave)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ia_fallback"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Fallback
            </label>
            <select
              id="ia_fallback"
              name="ia_fallback"
              defaultValue={config.fallback ?? ""}
              className={selectClass}
            >
              <option value="">Nenhum</option>
              {provedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rotulo}
                  {p.comChave ? "" : " (sem chave)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {provedores.map((p) => (
            <fieldset key={p.id} className="rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium text-foreground">{p.rotulo}</legend>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={`ia_${p.id}_modelo_texto`}
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Modelo de texto
                  </label>
                  <input
                    id={`ia_${p.id}_modelo_texto`}
                    name={`ia_${p.id}_modelo_texto`}
                    defaultValue={config.modelos[p.id].texto}
                    spellCheck={false}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`ia_${p.id}_modelo_visao`}
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Modelo de visão (fotos)
                  </label>
                  <input
                    id={`ia_${p.id}_modelo_visao`}
                    name={`ia_${p.id}_modelo_visao`}
                    defaultValue={config.modelos[p.id].visao}
                    spellCheck={false}
                    className={inputClass}
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>

        <Mensagem state={salvo} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-border pt-4">
        <form action={testar} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={testando}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {testando ? "Testando…" : "Testar modelos"}
            </button>
            <span className="text-xs text-muted-foreground">
              Uma chamada mínima em cada modelo salvo, nos provedores que têm chave.
            </span>
          </div>
          <Mensagem state={teste} />
        </form>
      </div>
    </div>
  );
}
