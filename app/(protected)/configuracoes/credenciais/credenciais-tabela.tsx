"use client";

import { useActionState } from "react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { inputClass } from "@/components/ui/form-field";
import type { CredencialResumo } from "@/lib/credenciais/queries";
import {
  removerCredencial,
  salvarCredencial,
  testarCredencial,
  type CredencialState,
} from "./actions";

// ─── Status ──────────────────────────────────────────────────────────────────

function StatusPill({ item }: { item: CredencialResumo }) {
  if (item.origem === "banco") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        Configurada · ····{item.ultimos4}
      </span>
    );
  }
  if (item.origem === "env") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        Via env var <code className="font-mono">{item.envVar}</code>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      Ausente
    </span>
  );
}

function Mensagem({ state }: { state: CredencialState }) {
  if (!state) return null;
  if ("error" in state) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
      {state.message}
    </p>
  );
}

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// ─── Card de uma integração gerenciável ──────────────────────────────────────

function CredencialCard({ item, masterKeyOk }: { item: CredencialResumo; masterKeyOk: boolean }) {
  const [salvo, salvar, salvando] = useActionState<CredencialState, FormData>(
    salvarCredencial,
    null,
  );
  const [teste, testar, testando] = useActionState<CredencialState, FormData>(
    testarCredencial,
    null,
  );
  const quando = formatarData(item.atualizadoEm);
  const podeTestar = item.testavel && item.origem !== "ausente";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{item.rotulo}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{item.descricao}</p>
        </div>
        <StatusPill item={item} />
      </div>

      {item.origem === "banco" && (
        <p className="mb-4 text-xs text-muted-foreground">
          Atualizada {quando ? `em ${quando}` : ""}
          {item.atualizadoPor ? ` por ${item.atualizadoPor}` : ""}.
        </p>
      )}

      {/* key força o campo a limpar depois de salvar com sucesso */}
      <form
        action={salvar}
        key={salvo && "ok" in salvo ? salvo.message : "nova-chave"}
        className="space-y-3"
      >
        <input type="hidden" name="chave" value={item.chave} />
        <label
          htmlFor={`valor-${item.chave}`}
          className="block text-sm font-medium text-foreground"
        >
          {item.origem === "banco" ? "Substituir por nova chave" : "Nova chave"}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`valor-${item.chave}`}
            name="valor"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={`Cole a chave gerada em ${item.obterEm}`}
            disabled={!masterKeyOk}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={salvando || !masterKeyOk}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
        <Mensagem state={salvo} />
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <form action={testar}>
          <input type="hidden" name="chave" value={item.chave} />
          <button
            type="submit"
            disabled={testando || !podeTestar}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {testando ? "Testando…" : "Testar conexão"}
          </button>
        </form>
        {item.origem === "banco" && (
          <form action={removerCredencial}>
            <input type="hidden" name="chave" value={item.chave} />
            <ConfirmButton
              message={`Remover a chave da ${item.rotulo} do banco? O servidor volta a usar ${item.envVar}, se existir.`}
              className="rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              Remover do banco
            </ConfirmButton>
          </form>
        )}
        <a
          href={item.obterEm}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Obter chave ↗
        </a>
      </div>
      <div className="mt-3">
        <Mensagem state={teste} />
      </div>
    </div>
  );
}

// ─── Tabela ──────────────────────────────────────────────────────────────────

export function CredenciaisTabela({
  itens,
  masterKeyOk,
}: {
  itens: CredencialResumo[];
  masterKeyOk: boolean;
}) {
  const gerenciaveis = itens.filter((i) => i.gerenciavel);
  const daInfra = itens.filter((i) => !i.gerenciavel);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        {gerenciaveis.map((item) => (
          <CredencialCard key={item.chave} item={item} masterKeyOk={masterKeyOk} />
        ))}
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-foreground">Geridas pela infra</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Estas integrações ainda leem a env var direto no servidor. Aqui só o status.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Integração</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Env var</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {daInfra.map((item) => (
                <tr key={item.chave} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{item.rotulo}</div>
                    <div className="text-xs text-muted-foreground">{item.descricao}</div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                    {item.envVar}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
