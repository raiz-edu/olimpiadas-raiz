"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/login/actions";
import { inputClass } from "@/components/ui/form-field";
import { createClient } from "@/lib/supabase/client";

type LoginState = {
  error?: string;
} | null;

const ERROS_OAUTH: Record<string, string> = {
  oauth: "Não foi possível autenticar com o Google. Tente novamente.",
  dominio: "Este e-mail não pertence a uma instituição parceira. Use seu e-mail institucional.",
  inativo: "Sua conta está inativa. Fale com o administrador.",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [googlePending, setGooglePending] = useState(false);
  const searchParams = useSearchParams();
  const erroOAuth = searchParams.get("erro") ? ERROS_OAUTH[searchParams.get("erro")!] : null;

  async function handleGoogle() {
    setGooglePending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  useEffect(() => {
    const email = sessionStorage.getItem("_test_email");
    const senha = sessionStorage.getItem("_test_senha");
    if (!email || !senha) return;
    sessionStorage.removeItem("_test_email");
    sessionStorage.removeItem("_test_senha");
    const fill = () => {
      const f = formRef.current;
      if (!f) return;
      const emailInput = f.querySelector('input[name="email"]') as HTMLInputElement;
      const passInput = f.querySelector('input[name="password"]') as HTMLInputElement;
      if (!emailInput || !passInput) return;
      emailInput.value = email;
      passInput.value = senha;
      const btn = f.querySelector('button[type="submit"]') as HTMLButtonElement;
      btn?.click();
    };
    setTimeout(fill, 200);
  }, []);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googlePending || isPending}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {googlePending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
        )}
        {googlePending ? "Redirecionando…" : "Entrar com Google"}
      </button>

      {erroOAuth && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erroOAuth}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou entre com e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form ref={formRef} action={formAction} className="space-y-5" noValidate>
        {state?.error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            className={inputClass}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={inputClass}
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          aria-busy={isPending}
        >
          {isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
