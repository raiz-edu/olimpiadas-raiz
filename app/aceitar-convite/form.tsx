"use client";

import { useActionState } from "react";
import { aceitarConvite } from "./actions";

type AceitarState = { error?: string } | null;

export function AceitarConviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, isPending] = useActionState<AceitarState, FormData>(
    aceitarConvite,
    null,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Email (read-only — vem do convite) */}
      <div className="space-y-1.5">
        <label htmlFor="email-display" className="block text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email-display"
          type="email"
          value={email}
          readOnly
          className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
          aria-readonly="true"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nome" className="block text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          placeholder="Seu nome completo"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-background"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Criar senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-background"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm_password" className="block text-sm font-medium text-foreground">
          Confirmar senha
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repita a senha"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-background"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-busy={isPending}
      >
        {isPending ? "Criando conta…" : "Criar conta e entrar"}
      </button>
    </form>
  );
}
