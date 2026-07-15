"use client";

import { useEffect } from "react";

/**
 * Entrega o token de handoff à janela que abriu o popup (o iframe da
 * plataforma dentro do Painel Pedagógico) e fecha o popup.
 *
 * O targetOrigin é a PRÓPRIA origem (popup e iframe são ambos
 * olimpiadas-raiz.vercel.app) — nunca o domínio do painel. O listener no
 * iframe valida event.origin da mesma forma.
 */
export function PopupCallbackClient({ handoff }: { handoff: string | null }) {
  useEffect(() => {
    if (!handoff || !window.opener) return;
    window.opener.postMessage({ type: "olimpiadas-auth", handoff }, window.location.origin);
    const t = setTimeout(() => window.close(), 500);
    return () => clearTimeout(t);
  }, [handoff]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        {handoff ? (
          <>
            <span className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            <p className="text-sm text-foreground">Concluindo login…</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Esta janela fechará sozinha. Se não fechar, pode fechá-la.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground">Não foi possível concluir o login.</p>
            <a href="/aluno/login" className="mt-2 inline-block text-xs underline">
              Voltar ao login
            </a>
          </>
        )}
      </div>
    </main>
  );
}
