"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAluno } from "@/app/aluno/login/actions";

const TEAL = "rgb(91,184,193)";

const ERROS_OAUTH: Record<string, string> = {
  oauth: "Não foi possível autenticar com o Google. Tente novamente.",
  dominio: "Este e-mail não pertence a uma instituição parceira. Use seu e-mail institucional.",
  portal:
    "A área administrativa é exclusiva para administradores. Acesse a Plataforma Olímpica aqui.",
};

export function LoginAlunoForm({ initialNeedsConsent = false }: { initialNeedsConsent?: boolean }) {
  const [state, formAction, isPending] = useActionState(
    loginAluno,
    initialNeedsConsent ? ({ needsConsent: true } as { needsConsent: true }) : null,
  );
  const needsConsent = state !== null && "needsConsent" in state;
  const errorMsg = state !== null && "error" in state ? state.error : null;
  const formRef = useRef<HTMLFormElement>(null);
  const [googlePending, setGooglePending] = useState(false);
  const searchParams = useSearchParams();
  const erroOAuth = searchParams.get("erro") ? ERROS_OAUTH[searchParams.get("erro")!] : null;

  function handleGoogle() {
    setGooglePending(true);
    window.location.href = "/api/auth/google?mode=aluno";
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
      {/* Botão Google SSO */}
      {!needsConsent && (
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
      )}

      {/* Erro de OAuth (vindo por query param) */}
      {erroOAuth && !needsConsent && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erroOAuth}
        </p>
      )}

      {/* Divisor */}
      {!needsConsent && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou entre com e-mail</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-4">
        {/* ── Passo 1: credenciais ─────────────────────────────── */}
        {!needsConsent && (
          <>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {/* ── Passo 2: consentimento (primeiro acesso) ─────────── */}
        {needsConsent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Login com Google verificado! Falta só mais um passo.</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                Passo 2 de 2 — Autorização do responsável
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Necessária uma única vez para liberar o acesso ao portal.
              </p>
            </div>

            <div>
              <label
                htmlFor="responsavel_nome"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Nome completo do responsável
              </label>
              <input
                id="responsavel_nome"
                name="responsavel_nome"
                type="text"
                autoComplete="off"
                autoFocus
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Tipo de responsável</p>
              <div className="flex gap-5">
                {[
                  { value: "pedagogico", label: "Pedagógico" },
                  { value: "financeiro", label: "Financeiro" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="responsavel_tipo"
                      value={opt.value}
                      className="h-4 w-4 accent-teal-500"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="consentimento_aceito"
                className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Autorizo o acesso do(a) aluno(a) à Plataforma Olímpica e concordo com o tratamento
                dos dados pessoais conforme a{" "}
                <span className="font-medium text-foreground">LGPD (Lei 13.709/2018)</span>.
              </span>
            </label>
          </div>
        )}

        {errorMsg && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: TEAL }}
        >
          {isPending ? "Aguarde…" : needsConsent ? "Autorizar e Entrar" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
